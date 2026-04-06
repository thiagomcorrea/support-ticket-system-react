import { useEffect, useRef, useState, useCallback } from "react";
import firebase from "../../services/firebaseConnection";
import { toast } from "react-toastify";

// Number of customers displayed per page
const PAGE_SIZE = 10;

export default function CustomersList({
  onEditCustomer,
  highlightedCustomerId,
}) {
  // Controls the delete confirmation modal visibility
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Stores the customer selected for deletion
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // Controls the loading state of the delete action
  const [deleting, setDeleting] = useState(false);

  // Stores the customers loaded from Firestore
  const [items, setItems] = useState([]);

  // Controls the loading state of the table
  const [loading, setLoading] = useState(true);

  // Search input value
  const [search, setSearch] = useState("");

  // Controls the loading state of the search button
  const [searching, setSearching] = useState(false);

  // Current page index (starts at 0)
  const [pageIndex, setPageIndex] = useState(0);

  // Stores the last Firestore document of each loaded page
  // This is used for cursor-based pagination
  const [pageLastDocs, setPageLastDocs] = useState([]);

  // Indicates whether there is another page after the current one
  const [hasNext, setHasNext] = useState(false);

  // Stores the active realtime listener unsubscribe function
  const unsubscribeRef = useRef(null);

  // Prevents repeated auth error toasts
  const hasShownAuthErrorRef = useRef(false);

  // Base reference for the customers collection
  function baseRef() {
    return firebase.firestore().collection("customers");
  }

  // Default query: load customers from the current user ordered by creation date
  function buildBaseQuery(userId) {
    return baseRef()
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(PAGE_SIZE);
  }

  // Search query: prefix search using companyNameLower
  function buildSearchQuery(userId, term) {
    const q = term.trim().toLowerCase();

    return baseRef()
      .where("userId", "==", userId)
      .orderBy("companyNameLower")
      .startAt(q)
      .endAt(q + "\uf8ff")
      .limit(PAGE_SIZE);
  }

  // Checks whether there is at least one more document after the current page
  async function checkHasNext(query, lastDoc) {
    if (!lastDoc) return false;

    const nextSnap = await query.startAfter(lastDoc).limit(1).get();
    return !nextSnap.empty;
  }

  // Removes the active realtime listener before creating a new one
  function cleanupListener() {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }

  // Loads a specific page and keeps it synced in realtime using onSnapshot
  // Optional searchTerm lets us control exactly which query should be used
  async function subscribeToPage(targetPageIndex, searchTerm = search) {
    const user = firebase.auth().currentUser;

    if (!user) {
      cleanupListener();
      setLoading(false);
      setItems([]);
      setHasNext(false);

      if (!hasShownAuthErrorRef.current) {
        toast.error("You are not authenticated. Please sign in again.");
        hasShownAuthErrorRef.current = true;
      }

      return;
    }

    hasShownAuthErrorRef.current = false;
    setLoading(true);

    try {
      const term = searchTerm.trim();

      // Choose the base query according to search state
      const baseQuery = term
        ? buildSearchQuery(user.uid, term)
        : buildBaseQuery(user.uid);

      let query = baseQuery;

      // If it's not the first page, continue after the last document
      // stored for the previous page
      if (targetPageIndex > 0) {
        const prevLastDoc = pageLastDocs[targetPageIndex - 1];

        if (prevLastDoc) {
          query = baseQuery.startAfter(prevLastDoc);
        }
      }

      // Remove the old listener before opening a new one
      cleanupListener();

      // Create realtime listener for the current page
      unsubscribeRef.current = query.onSnapshot(
        async (snap) => {
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setItems(docs);

          // Save the last doc of the current page for future pagination
          const last = snap.docs[snap.docs.length - 1] || null;

          setPageLastDocs((prev) => {
            const copy = [...prev];
            copy[targetPageIndex] = last;
            return copy;
          });

          // Check whether another page exists
          setHasNext(await checkHasNext(baseQuery, last));
          setPageIndex(targetPageIndex);
          setLoading(false);
        },
        (err) => {
          console.log(err);
          toast.error(
            "Failed to load customers in realtime. If Firestore asks for an index, open the link it provides and create it."
          );
          setItems([]);
          setHasNext(false);
          setLoading(false);
        }
      );
    } catch (err) {
      console.log(err);
      toast.error(
        "Failed to initialize realtime customer list. Check Firestore indexes and permissions."
      );
      setItems([]);
      setHasNext(false);
      setLoading(false);
    }
  }

  // Opens the delete confirmation modal with the selected customer
  function openDeleteModal(customer) {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  }

  // Closes the delete confirmation modal and clears the selected customer
  const closeDeleteModal = useCallback(() => {
    if (deleting) return;

    setIsDeleteModalOpen(false);
    setCustomerToDelete(null);
  }, [deleting]);

  // Deletes the customer currently selected in the confirmation modal
  async function handleDelete() {
    if (!customerToDelete?.id) return;

    setDeleting(true);

    try {
      await firebase
        .firestore()
        .collection("customers")
        .doc(customerToDelete.id)
        .delete();

      toast.success("Customer deleted successfully!");

      // If the current page had only one item and it was deleted,
      // go back one page to avoid showing an empty page
      const isLastItemOnPage = items.length === 1 && pageIndex > 0;

      // Close the modal before updating the table view
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);

      if (isLastItemOnPage) {
        await subscribeToPage(pageIndex - 1);
      }
      // If not the last item, the realtime listener updates the table automatically
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete customer.");
    } finally {
      setDeleting(false);
    }
  }

  // Loads the first page when authentication state becomes available
  useEffect(() => {
    const unsubAuth = firebase.auth().onAuthStateChanged(() => {
      setPageLastDocs([]);
      setPageIndex(0);
      subscribeToPage(0);
    });

    return () => {
      unsubAuth();
      cleanupListener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

// Closes the modal when pressing the Escape key
useEffect(() => {
  function handleKeyDown(e) {
    if (e.key === "Escape") {
      closeDeleteModal();
    }
  }

  if (isDeleteModalOpen) {
    window.addEventListener("keydown", handleKeyDown);
  }

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [isDeleteModalOpen, closeDeleteModal]);

  // Executes the search and resets pagination
  async function onSearchSubmit(e) {
    if (e) e.preventDefault();

    setSearching(true);

    try {
      setPageLastDocs([]);
      setPageIndex(0);
      await subscribeToPage(0, search);
    } finally {
      setSearching(false);
    }
  }

  // Clears the search input and reloads the first page without filters
  function onClear() {
    setSearch("");
    setPageLastDocs([]);
    setPageIndex(0);

    // Force a clean query immediately, without depending on async state updates
    subscribeToPage(0, "");
  }

  // Goes to the next page
  function goNext() {
    if (!hasNext || loading) return;
    subscribeToPage(pageIndex + 1);
  }

  // Goes to the previous page
  function goPrev() {
    if (pageIndex === 0 || loading) return;
    subscribeToPage(pageIndex - 1);
  }

  return (
    <div className="customers-list-wrapper">
      {/* Search bar */}
      <div className="customers-search-bar">
        <input
          className="customers-search-input"
          placeholder="Search by company name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSearchSubmit();
            }
          }}
        />

        <button
          type="button"
          className="customers-search-button"
          onClick={onSearchSubmit}
          disabled={searching}
        >
          {searching ? "Searching..." : "Search"}
        </button>

        <button
          type="button"
          className="customers-clear-button"
          onClick={onClear}
          disabled={searching || (!search && items.length === 0)}
        >
          Clear
        </button>
      </div>

      <div className="customers-list-content">
        {/* Loading state */}
        {loading ? (
          <div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="customers-empty-state">No customers found.</p>
        ) : (
          <div className="customers-table-wrapper">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Tax ID</th>
                  <th>City</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {items.map((c) => (
                  <tr
                    key={c.id}
                    className={c.id === highlightedCustomerId ? "highlighted-row" : ""}
                  >
                    <td>{c.companyName ?? "-"}</td>
                    <td>{c.taxId ?? "-"}</td>
                    <td>{c.address?.city ?? "-"}</td>
                    <td>{c.address?.country ?? "-"}</td>

                    <td>
                      <span
                        className={`customer-status customer-status-${c.status || "unknown"}`}
                      >
                        {c.status ?? "-"}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        {/* Sends the selected customer data to the parent form */}
                        <button
                          type="button"
                          className="btn-edit"
                          onClick={() => onEditCustomer && onEditCustomer(c)}
                        >
                          Edit
                        </button>

                        {/* Opens the delete confirmation modal */}
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => openDeleteModal(c)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        <div className="customers-pagination">
          <button
            type="button"
            onClick={goPrev}
            disabled={loading || pageIndex === 0}
          >
            Previous
          </button>

          <span>Page {pageIndex + 1}</span>

          <button
            type="button"
            onClick={goNext}
            disabled={loading || !hasNext}
          >
            Next
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div
            className="confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete Customer</h3>

            <p>
              Are you sure you want to delete{" "}
              <strong>{customerToDelete?.companyName || "this customer"}</strong>?
            </p>

            <p className="confirm-modal-warning">
              This action cannot be undone.
            </p>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="modal-cancel-button"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="modal-delete-button"
                onClick={handleDelete}
                disabled={deleting}
                autoFocus
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}