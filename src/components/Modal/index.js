import './modal.css';
import { FiX, FiCalendar, FiUser, FiTag, FiFileText } from 'react-icons/fi';

function normalizeStatus(status) {
  if (!status) return 'Open';
  if (status === 'Aberto') return 'Open';
  if (status === 'Progresso') return 'In Progress';
  if (status === 'Atendido') return 'Closed';
  return status;
}

function getStatusClass(status) {
  const normalized = normalizeStatus(status);

  if (normalized === 'Open') return 'badge-open';
  if (normalized === 'In Progress') return 'badge-progress';
  return 'badge-closed';
}

export default function Modal({ conteudo, close }) {
  const client = conteudo?.client || conteudo?.cliente || 'Not informed';
  const subject = conteudo?.subject || conteudo?.assunto || 'Not informed';
  const createdAt =
    conteudo?.createdFormatted || conteudo?.createdFormated || 'Not informed';
  const status = normalizeStatus(conteudo?.status);
  const details = conteudo?.details || conteudo?.complemento || '';

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button className="modal-close" onClick={close}>
          <FiX size={18} />
          Close
        </button>

        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">Ticket details</p>
            <h2>{subject}</h2>
            <p className="modal-subtitle">
              Review the main information for this support request.
            </p>
          </div>

          <span className={`status-badge ${getStatusClass(status)}`}>
            {status}
          </span>
        </div>

        <div className="modal-grid">
          <div className="info-card">
            <div className="info-label">
              <FiUser size={16} />
              <span>Client</span>
            </div>
            <p>{client}</p>
          </div>

          <div className="info-card">
            <div className="info-label">
              <FiTag size={16} />
              <span>Subject</span>
            </div>
            <p>{subject}</p>
          </div>

          <div className="info-card">
            <div className="info-label">
              <FiCalendar size={16} />
              <span>Created At</span>
            </div>
            <p>{createdAt}</p>
          </div>

          <div className="info-card">
            <div className="info-label">
              <FiFileText size={16} />
              <span>Status</span>
            </div>
            <p>{status}</p>
          </div>
        </div>

        <div className="details-section">
          <h3>Details</h3>
          {details ? (
            <p>{details}</p>
          ) : (
            <p className="empty-details">No additional details provided.</p>
          )}
        </div>
      </div>
    </div>
  );
}