import { useEffect, useMemo, useState } from "react";
import "./customers.css";
import Title from "../../components/Title";
import Header from "../../components/Header";
import firebase from "../../services/firebaseConnection";
import { FiUser } from "react-icons/fi";
import { toast } from "react-toastify";

import CustomersList from "./customerslist";

const initialForm = {
  // Company
  companyName: "",
  legalName: "",
  taxId: "", // CNPJ/VAT/Tax ID
  website: "",
  industry: "",
  status: "active", // active | inactive | prospect
  tags: "", // comma-separated input

  // Primary contact
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  preferredContactMethod: "email", // email | phone | whatsapp

  // Address
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  country: "Brazil",

  // Billing
  billingEmail: "",
  paymentTerms: "net_30", // net_7 | net_15 | net_30 | net_45 | net_60 | due_on_receipt
  billingNotes: "",

  // Notes
  notes: "",
};

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeTags(tags) {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 15);
}

export default function Customers() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  // Controls the current color theme
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  
  // Stores the customer currently being edited
  const [editingId, setEditingId] = useState(null);

  // Stores the id of the last updated customer to highlight it in the table
  const [highlightedCustomerId, setHighlightedCustomerId] = useState(null);

  // Persists the selected theme and applies it to the document body
  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const currentUser = useMemo(() => firebase.auth().currentUser, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // Toggles between light and dark theme
  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  // Fills the form with the selected customer data for editing
  function handleEditCustomer(customer) {
    setEditingId(customer.id);

    setForm({
      // Company
      companyName: customer.companyName || "",
      legalName: customer.legalName || "",
      taxId: customer.taxId || "",
      website: customer.website || "",
      industry: customer.industry || "",
      status: customer.status || "active",
      tags: Array.isArray(customer.tags) ? customer.tags.join(", ") : "",

      // Primary contact
      contactName: customer.primaryContact?.name || "",
      contactEmail: customer.primaryContact?.email || "",
      contactPhone: customer.primaryContact?.phone || "",
      preferredContactMethod:
        customer.primaryContact?.preferredContactMethod || "email",

      // Address
      addressLine1: customer.address?.line1 || "",
      addressLine2: customer.address?.line2 || "",
      city: customer.address?.city || "",
      stateProvince: customer.address?.stateProvince || "",
      postalCode: customer.address?.postalCode || "",
      country: customer.address?.country || "Brazil",

      // Billing
      billingEmail: customer.billing?.billingEmail || "",
      paymentTerms: customer.billing?.paymentTerms || "net_30",
      billingNotes: customer.billing?.notes || "",

      // Notes
      notes: customer.notes || "",
    });
  }

  function validate() {
    if (!form.companyName.trim()) return "Company name is required.";
    if (!form.taxId.trim()) return "Tax ID is required (CNPJ/VAT).";

    // Contact email optional, but if filled must be valid
    if (form.contactEmail.trim() && !isEmail(form.contactEmail)) {
      return "Primary contact email is invalid.";
    }

    // Billing email optional, but if filled must be valid
    if (form.billingEmail.trim() && !isEmail(form.billingEmail)) {
      return "Billing email is invalid.";
    }

    // Address recommended (you can decide required)
    if (!form.addressLine1.trim()) return "Address line 1 is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.country.trim()) return "Country is required.";

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Ensure Firebase auth (not only localStorage)
    const user = firebase.auth().currentUser;
    if (!user) {
      toast.error("You are not authenticated. Please sign in again.");
      return;
    }

    const errorMsg = validate();
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    setSaving(true);

    try {
      // Shared payload for both create and update actions
      const payload = {
        userId: user.uid,

        companyName: form.companyName.trim(),
        companyNameLower: form.companyName.trim().toLowerCase(),
        legalName: form.legalName.trim() || null,
        taxId: form.taxId.trim(),
        website: form.website.trim() || null,
        industry: form.industry.trim() || null,
        status: form.status,

        tags: normalizeTags(form.tags),

        primaryContact: {
          name: form.contactName.trim() || null,
          email: form.contactEmail.trim() || null,
          phone: form.contactPhone.trim() || null,
          preferredContactMethod: form.preferredContactMethod,
        },

        address: {
          line1: form.addressLine1.trim(),
          line2: form.addressLine2.trim() || null,
          city: form.city.trim(),
          stateProvince: form.stateProvince.trim() || null,
          postalCode: form.postalCode.trim() || null,
          country: form.country.trim(),
        },

        billing: {
          billingEmail: form.billingEmail.trim() || null,
          paymentTerms: form.paymentTerms,
          notes: form.billingNotes.trim() || null,
        },

        notes: form.notes.trim() || null,

        // Always update the modification timestamp
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      if (editingId) {
      // Keep a copy of the current editing id before resetting the form
      const updatedCustomerId = editingId;

      // Update existing customer
      await firebase
        .firestore()
        .collection("customers")
        .doc(editingId)
        .update(payload);

      toast.success("Customer updated successfully!");

      // Highlight the updated customer row in the table
      setHighlightedCustomerId(updatedCustomerId);

      // Remove the highlight automatically after a few seconds
      setTimeout(() => {
        setHighlightedCustomerId((current) =>
          current === updatedCustomerId ? null : current
        );
      }, 3000);
      } else {
        // Create new customer
        await firebase.firestore().collection("customers").add({
          ...payload,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        toast.success("Customer created successfully!");
      }

      // Reset form state after successful save
      setForm(initialForm);
      setEditingId(null);      

      // Scroll to top after saving (better UX)
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      
    } catch (err) {
      console.log(err);
      toast.error(
        editingId
          ? "Failed to update customer. Check Firestore permissions/rules."
          : "Failed to create customer. Check Firestore permissions/rules."
      );
    } finally {
      setSaving(false);
    }
  }

  // Clears the form and exits edit mode
  function handleReset() {
    setForm(initialForm);
    setEditingId(null);
  }

  return (
    <div>
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <div className="content customers-page">
        <Title name="Customers">
          <FiUser size={25} />
        </Title>

        <div className="container customers-container">
          <div className="customers-grid">

            {/* LEFT: LIST */}
            <div className="customers-card customers-list">
              <CustomersList
                onEditCustomer={handleEditCustomer}
                highlightedCustomerId={highlightedCustomerId}
              />
            </div>

            {/* RIGHT: FORM */}
            <div className="customers-card customers-form customers-form-sticky">
              
              {editingId && (
                <div className="editing-banner">
                  Editing customer: <strong>{form.companyName}</strong>
                </div>
              )}

              <form
                className={`form-profile customers ${editingId ? "editing-mode" : ""}`}
                onSubmit={handleSubmit}
              >
              
              <div className="customer-section">
                <div className="customer-section-header">
                  {/* COMPANY */}
                  <h3 style={{ marginTop: 8 }}>Company</h3>

                  <label>Company name *</label>
                  <input
                    name="companyName"
                    type="text"
                    placeholder="e.g., Angels Cry Paper"
                    value={form.companyName}
                    onChange={onChange}
                  />

                  <label>Legal name</label>
                  <input
                    name="legalName"
                    type="text"
                    placeholder="e.g., Angels Cry Paper LTDA"
                    value={form.legalName}
                    onChange={onChange}
                  />

                  <label>Tax ID (CNPJ/VAT) *</label>
                  <input
                    name="taxId"
                    type="text"
                    placeholder="e.g., 14.786.141/0001-96"
                    value={form.taxId}
                    onChange={onChange}
                  />

                  <label>Website</label>
                  <input
                    name="website"
                    type="url"
                    placeholder="https://company.com"
                    value={form.website}
                    onChange={onChange}
                  />

                  <label>Industry</label>
                  <input
                    name="industry"
                    type="text"
                    placeholder="e.g., Manufacturing"
                    value={form.industry}
                    onChange={onChange}
                  />

                  <label>Status</label>
                  <select name="status" value={form.status} onChange={onChange}>
                    <option value="active">Active</option>
                    <option value="prospect">Prospect</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <label>Tags (comma separated)</label>
                  <input
                    name="tags"
                    type="text"
                    placeholder="e.g., vip, recurring, urgent"
                    value={form.tags}
                    onChange={onChange}
                  />
                </div>
              </div>

              <hr />

              {/* PRIMARY CONTACT */}
              <div className="customer-section">
                <div className="customer-section-header">
                  <h3>Primary contact</h3>

                  <label>Contact name</label>
                  <input
                    name="contactName"
                    type="text"
                    placeholder="e.g., John Smith"
                    value={form.contactName}
                    onChange={onChange}
                  />

                  <label>Contact email</label>
                  <input
                    name="contactEmail"
                    type="email"
                    placeholder="john@company.com"
                    value={form.contactEmail}
                    onChange={onChange}
                  />

                  <label>Contact phone</label>
                  <input
                    name="contactPhone"
                    type="tel"
                    placeholder="+55 11 99999-9999"
                    value={form.contactPhone}
                    onChange={onChange}
                  />

                  <label>Preferred contact method</label>
                  <select
                    name="preferredContactMethod"
                    value={form.preferredContactMethod}
                    onChange={onChange}
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>

                  <hr style={{ margin: "18px 0" }} />
                </div>
              </div>

              {/* ADDRESS */}
              <div className="customer-section">
                <div className="customer-section-header">
                  <h3>Address</h3>

                  <label>Address line 1 *</label>
                  <input
                    name="addressLine1"
                    type="text"
                    placeholder="Street, number"
                    value={form.addressLine1}
                    onChange={onChange}
                  />

                  <label>Address line 2</label>
                  <input
                    name="addressLine2"
                    type="text"
                    placeholder="Apartment, suite, building"
                    value={form.addressLine2}
                    onChange={onChange}
                  />

                  <label>City *</label>
                  <input
                    name="city"
                    type="text"
                    placeholder="e.g., New York"
                    value={form.city}
                    onChange={onChange}
                  />

                  <label>State / Province</label>
                  <input
                    name="stateProvince"
                    type="text"
                    placeholder="e.g., NY"
                    value={form.stateProvince}
                    onChange={onChange}
                  />

                  <label>Postal code</label>
                  <input
                    name="postalCode"
                    type="text"
                    placeholder="e.g., 10011"
                    value={form.postalCode}
                    onChange={onChange}
                  />

                  <label>Country *</label>
                  <input
                    name="country"
                    type="text"
                    placeholder="e.g., Brazil"
                    value={form.country}
                    onChange={onChange}
                  />
                </div>
              </div>

              <hr/>

              <div className="customer-section">
                <div className="customer-section-header">
                  {/* BILLING */}
                  <h3>Billing</h3>

                  <label>Billing email</label>
                  <input
                    name="billingEmail"
                    type="email"
                    placeholder="billing@company.com"
                    value={form.billingEmail}
                    onChange={onChange}
                  />

                  <label>Payment terms</label>
                  <select
                    name="paymentTerms"
                    value={form.paymentTerms}
                    onChange={onChange}
                  >
                    <option value="due_on_receipt">Due on receipt</option>
                    <option value="net_7">Net 7</option>
                    <option value="net_15">Net 15</option>
                    <option value="net_30">Net 30</option>
                    <option value="net_45">Net 45</option>
                    <option value="net_60">Net 60</option>
                  </select>

                  <label>Billing notes</label>
                  <textarea
                    name="billingNotes"
                    rows={3}
                    placeholder="Invoice preferences, PO required, etc."
                    value={form.billingNotes}
                    onChange={onChange}
                  />
                </div>
              </div>

              <hr/>

              <div className="customer-section">
                <div className="customer-section-header">
                  {/* NOTES */}
                  <h3>Internal notes</h3>
                  <textarea
                    name="notes"
                    rows={4}
                    placeholder="Extra details about this customer..."
                    value={form.notes}
                    onChange={onChange}
                  />
                  </div>
              </div>

              <div className="customers-actions">
              <button
                className="customers-primary-action"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Customer"
                  : "Create Customer"}
              </button>

              <button
                className="customers-secondary-action"
                type="button"
                onClick={handleReset}
                disabled={saving}
              >
                {editingId ? "Cancel" : "Clear"}
              </button>
            </div>

              {!currentUser && (
                <p style={{ marginTop: 10, opacity: 0.7 }}>
                  You are not authenticated.
                </p>
              )}
                </form>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}