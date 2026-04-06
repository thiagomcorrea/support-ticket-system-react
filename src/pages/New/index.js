import { useState, useEffect, useContext } from "react";

import firebase from "../../services/firebaseConnection";
import { useNavigate, useParams } from "react-router-dom";

import Header from "../../components/Header";
import Title from "../../components/Title";
import { AuthContext } from "../../contexts/auth";
import { toast } from "react-toastify";

import "./new.css";
import { FiPlusCircle } from "react-icons/fi";

function normalizeStatus(status) {
  if (!status) return "Open";
  if (status === "Aberto") return "Open";
  if (status === "Progresso") return "In Progress";
  if (status === "Atendido") return "Closed";
  return status;
}

export default function New() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [customerIndex, setCustomerIndex] = useState(0);

  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("Open");
  const [details, setDetails] = useState("");

  const [editing, setEditing] = useState(false);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  useEffect(() => {
    async function loadCustomers() {
      try {
        const snapshot = await firebase.firestore().collection("customers").get();

        const list = [];

        snapshot.forEach((doc) => {
          const data = doc.data();

          list.push({
            id: doc.id,
            name:
              data.name ||
              data.nomeFantasia ||
              data.fantasyName ||
              data.companyName ||
              data.customerName ||
              "Unnamed client",
          });
        });

        if (list.length === 0) {
          setCustomers([{ id: "1", name: "Freelancer" }]);
          setLoadingCustomers(false);
          return;
        }

        setCustomers(list);
        setLoadingCustomers(false);

        if (id) {
          loadTicketById(list);
        }
      } catch (error) {
        console.log("Error loading customers:", error);
        setCustomers([{ id: "1", name: "Freelancer" }]);
        setLoadingCustomers(false);
      }
    }

    loadCustomers();
  }, [id]);

  async function loadTicketById(list) {
    await firebase
      .firestore()
      .collection("calls")
      .doc(id)
      .get()
      .then((snapshot) => {
        const data = snapshot.data();

        setSubject(data.subject || data.assunto || "");
        setStatus(normalizeStatus(data.status));
        setDetails(data.details || data.complemento || "");

        const index = list.findIndex(
          (item) => item.id === (data.clientId || data.clienteId)
        );

        setCustomerIndex(index >= 0 ? index : 0);
        setEditing(true);
      });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!subject) {
      toast.error("Please select a subject");
      return;
    }

    const selectedCustomer = customers[customerIndex];

    if (!selectedCustomer) {
      toast.error("Please select a valid client");
      return;
    }

    const payload = {
      client: selectedCustomer.name,
      clientId: selectedCustomer.id,
      subject,
      status,
      details,
      userId: user.uid,
    };

    if (editing) {
      await firebase
        .firestore()
        .collection("calls")
        .doc(id)
        .update(payload)
        .then(() => {
          toast.success("Ticket updated successfully");
          navigate("/dashboard");
        })
        .catch((error) => {
          console.log("Error updating ticket:", error);
          toast.error(`Error updating ticket: ${error.message}`);
        });

      return;
    }

    await firebase
      .firestore()
      .collection("calls")
      .add({
        ...payload,
        created: new Date(),
      })
      .then(() => {
        toast.success("Ticket created successfully");
        setDetails("");
        setCustomerIndex(0);
        setSubject("");
        setStatus("Open");
      })
      .catch((error) => {
        console.log("Error creating ticket:", error);
        toast.error(`Error creating ticket: ${error.message}`);
      });
  }

  return (
    <div>
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <div className="content new-page">
        <Title name={editing ? "Edit Ticket" : "New Ticket"}>
          <FiPlusCircle size={25} />
        </Title>

        <div className="container">
          <form className="ticket-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Client</label>
                {loadingCustomers ? (
                  <input disabled value="Loading customers..." />
                ) : (
                  <select
                    value={customerIndex}
                    onChange={(e) => setCustomerIndex(Number(e.target.value))}
                  >
                    {customers.map((item, index) => (
                      <option key={item.id} value={index}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label>Subject</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                  <option value="">Select a subject</option>
                  <option value="Support">Support</option>
                  <option value="Technical Visit">Technical Visit</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Status</label>

              <div className="status-buttons">
                {["Open", "In Progress", "Closed"].map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={`status-pill ${status === item ? "active" : ""}`}
                    onClick={() => setStatus(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Details</label>
              <textarea
                placeholder="Describe the issue (optional)"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-submit">
              {editing ? "Update Ticket" : "Create Ticket"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}