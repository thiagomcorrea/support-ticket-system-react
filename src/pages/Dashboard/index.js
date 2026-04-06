import "./dashboard.css";
import { useState, useEffect, useMemo } from "react";

import Header from "../../components/Header";
import Title from "../../components/Title";
import {
  FiMessageSquare,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiFilter,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { format } from "date-fns";

import firebase from "../../services/firebaseConnection";
import Modal from "../../components/Modal";

const ticketsRef = firebase.firestore().collection("calls").orderBy("created", "desc");

function normalizeStatus(status) {
  if (!status) return "Open";
  if (status === "Aberto") return "Open";
  if (status === "Progresso") return "In Progress";
  if (status === "Atendido") return "Closed";
  return status;
}

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [lastDocs, setLastDocs] = useState(null);

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  useEffect(() => {
    async function loadTickets() {
      try {
        const snapshot = await ticketsRef.limit(8).get();
        updateState(snapshot, true);
      } catch (err) {
        console.log("Something went wrong: ", err);
        setLoadingMore(false);
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  function updateState(snapshot, isFirstLoad = false) {
    const isCollectionEmpty = snapshot.size === 0;

    if (!isCollectionEmpty) {
      const list = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        list.push({
          id: doc.id,
          subject: data.subject || data.assunto || "",
          client: data.client || data.cliente || "",
          clientId: data.clientId || data.clienteId || "",
          created: data.created || null,
          createdFormatted: data.created
            ? format(data.created.toDate(), "dd/MM/yyyy HH:mm:ss")
            : "",
          status: normalizeStatus(data.status),
          details: data.details || data.complemento || "",
        });
      });

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      setTickets((prevTickets) => (isFirstLoad ? list : [...prevTickets, ...list]));
      setLastDocs(lastDoc);
      setIsEmpty(false);
    } else {
      if (isFirstLoad) {
        setTickets([]);
      }
      setIsEmpty(true);
    }

    setLoadingMore(false);
  }

  async function handleMore() {
    if (!lastDocs) return;

    setLoadingMore(true);

    try {
      const snapshot = await ticketsRef.startAfter(lastDocs).limit(8).get();
      updateState(snapshot);
    } catch (err) {
      console.log("Error loading more tickets: ", err);
      setLoadingMore(false);
    }
  }

  function toggleTicketModal(item) {
    setShowTicketModal(!showTicketModal);
    setSelectedTicket(item || null);
  }

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((item) => item.status === "Open").length;
    const inProgress = tickets.filter((item) => item.status === "In Progress").length;
    const closed = tickets.filter((item) => item.status === "Closed").length;

    return { total, open, inProgress, closed };
  }, [tickets]);

  const latestTicket = useMemo(() => {
    if (tickets.length === 0) return null;
    return tickets[0];
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    let filtered = [...tickets];

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        if (statusFilter === "open") return item.status === "Open";
        if (statusFilter === "progress") return item.status === "In Progress";
        if (statusFilter === "closed") return item.status === "Closed";
        return true;
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.client.toLowerCase().includes(term) ||
          item.subject.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [tickets, statusFilter, searchTerm]);

  function getStatusClass(status) {
    if (status === "Open") return "badge-open";
    if (status === "In Progress") return "badge-progress";
    return "badge-closed";
  }

  function getStatusWidth(value) {
    const total = stats.total || 1;
    return `${(value / total) * 100}%`;
  }

  if (loading) {
    return (
      <div>
        <Header theme={theme} onToggleTheme={toggleTheme} />

        <div className="content">
          <Title name="Dashboard">
            <FiMessageSquare size={25} />
          </Title>

          <div className="container dashboard">
            <div className="dashboard-loading">
              <span>Loading tickets...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <div className="content">
        <Title name="Dashboard">
          <FiMessageSquare size={25} />
        </Title>

        <div className="container dashboard">
          <section className="dashboard-hero">
            <div className="hero-text">
              <p className="hero-eyebrow">Support overview</p>
              <h1>Manage tickets with clarity and speed</h1>
              <p className="hero-description">
                Track ticket activity, monitor current status and manage your
                customer support workflow through a clean professional dashboard.
              </p>
            </div>

            <div className="hero-actions">
              <Link to="/new" className="btn-primary">
                <FiPlus size={18} />
                New Ticket
              </Link>
            </div>
          </section>

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total">
                <FiMessageSquare size={20} />
              </div>
              <div>
                <span className="stat-label">Total Tickets</span>
                <strong className="stat-value">{stats.total}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon open">
                <FiAlertCircle size={20} />
              </div>
              <div>
                <span className="stat-label">Open</span>
                <strong className="stat-value">{stats.open}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon progress">
                <FiClock size={20} />
              </div>
              <div>
                <span className="stat-label">In Progress</span>
                <strong className="stat-value">{stats.inProgress}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon closed">
                <FiCheckCircle size={20} />
              </div>
              <div>
                <span className="stat-label">Closed</span>
                <strong className="stat-value">{stats.closed}</strong>
              </div>
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="dashboard-card chart-card">
              <div className="card-header">
                <div>
                  <h2>Status Distribution</h2>
                  <p>Quick visual summary of your ticket volume by status.</p>
                </div>
                <FiTrendingUp size={18} />
              </div>

              <div className="chart-list">
                <div className="chart-row">
                  <div className="chart-meta">
                    <span>Open</span>
                    <strong>{stats.open}</strong>
                  </div>
                  <div className="chart-bar">
                    <div
                      className="chart-fill open"
                      style={{ width: getStatusWidth(stats.open) }}
                    />
                  </div>
                </div>

                <div className="chart-row">
                  <div className="chart-meta">
                    <span>In Progress</span>
                    <strong>{stats.inProgress}</strong>
                  </div>
                  <div className="chart-bar">
                    <div
                      className="chart-fill progress"
                      style={{ width: getStatusWidth(stats.inProgress) }}
                    />
                  </div>
                </div>

                <div className="chart-row">
                  <div className="chart-meta">
                    <span>Closed</span>
                    <strong>{stats.closed}</strong>
                  </div>
                  <div className="chart-bar">
                    <div
                      className="chart-fill closed"
                      style={{ width: getStatusWidth(stats.closed) }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-card latest-card">
              <div className="card-header">
                <div>
                  <h2>Latest Ticket</h2>
                  <p>Most recent support request created in the system.</p>
                </div>
                <FiClock size={18} />
              </div>

              {latestTicket ? (
                <div className="latest-ticket">
                  <span className={`badge ${getStatusClass(latestTicket.status)}`}>
                    {latestTicket.status}
                  </span>

                  <h3>{latestTicket.subject || "Untitled ticket"}</h3>
                  <p>
                    <strong>Client:</strong> {latestTicket.client || "Not informed"}
                  </p>
                  <p>
                    <strong>Created:</strong> {latestTicket.createdFormatted}
                  </p>

                  <div className="latest-actions">
                    <button
                      className="action action-view"
                      onClick={() => toggleTicketModal(latestTicket)}
                    >
                      <FiSearch size={16} />
                    </button>

                    <Link className="action action-edit" to={`/new/${latestTicket.id}`}>
                      <FiEdit2 size={16} />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mini-empty">
                  <p>No recent tickets available yet.</p>
                </div>
              )}
            </div>
          </section>

          <section className="dashboard-card table-card">
            <div className="panel-header">
              <div>
                <h2>Recent Tickets</h2>
                <p>Search, filter and manage your latest customer requests.</p>
              </div>

              <Link to="/new" className="btn-secondary">
                <FiPlus size={18} />
                New Ticket
              </Link>
            </div>

            {tickets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <FiMessageSquare size={34} />
                </div>
                <h3>No tickets found</h3>
                <p>
                  You do not have any support tickets yet. Start by creating your
                  first ticket to populate the dashboard.
                </p>

                <Link to="/new" className="btn-primary empty-button">
                  <FiPlus size={18} />
                  Create First Ticket
                </Link>
              </div>
            ) : (
              <>
                <div className="toolbar">
                  <div className="search-box">
                    <FiSearch size={18} />
                    <input
                      type="text"
                      placeholder="Search by client or subject..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="filter-box">
                    <FiFilter size={16} />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                {filteredTickets.length === 0 ? (
                  <div className="mini-empty bordered">
                    <p>No tickets match your current search or filter.</p>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Client</th>
                          <th scope="col">Subject</th>
                          <th scope="col">Status</th>
                          <th scope="col">Created At</th>
                          <th scope="col">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredTickets.map((item) => (
                          <tr key={item.id}>
                            <td data-label="Client">{item.client}</td>
                            <td data-label="Subject">{item.subject}</td>
                            <td data-label="Status">
                              <span className={`badge ${getStatusClass(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td data-label="Created At">{item.createdFormatted}</td>
                            <td data-label="Actions">
                              <div className="table-actions">
                                <button
                                  className="action action-view"
                                  onClick={() => toggleTicketModal(item)}
                                >
                                  <FiSearch size={16} />
                                </button>

                                <Link
                                  className="action action-edit"
                                  to={`/new/${item.id}`}
                                >
                                  <FiEdit2 size={16} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {loadingMore && (
                  <h3 className="loading-more">Loading more tickets...</h3>
                )}

                {!loadingMore && !isEmpty && (
                  <div className="actions">
                    <button className="btn-more" onClick={handleMore}>
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {showTicketModal && <Modal conteudo={selectedTicket} close={toggleTicketModal} />}
    </div>
  );
}