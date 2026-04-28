import { Link } from 'react-router-dom';
import AlertTimeline from '../components/AlertTimeline.jsx';
import { useApp } from '../state/AppContext.jsx';

export default function AlertsPage() {
  const { alerts, refresh } = useApp();

  return (
    <div className="page">
      <header className="page-header row">
        <div>
          <h1 className="section-title">Alerts</h1>
          <p className="muted">High-risk findings raised by the AI engine.</p>
        </div>
        <div className="header-actions">
          <button className="btn ghost" onClick={refresh}>↻ Refresh</button>
          <Link className="btn primary glow-btn" to="/upload">+ New scan</Link>
        </div>
      </header>

      <section className="card glass">
        {alerts.length === 0 ? (
          <div className="empty">
            <div className="empty-icon" aria-hidden>🚨</div>
            <h3>No alerts yet</h3>
            <p className="muted">When a scan is classified as high risk, you'll see it here.</p>
          </div>
        ) : (
          <ul className="alerts-list">
            {alerts.map((a) => (
              <li key={a.id} className="alert-item glass-warn fade-in">
                <div className="alert-icon pulse" aria-hidden>🚨</div>
                <div className="alert-body">
                  <div className="alert-head">
                    <strong>{a.type}</strong>
                    <span className="muted small">{formatDate(a.createdAt)}</span>
                  </div>
                  <p>{a.message}</p>
                  {a.source_url && (
                    <a className="link" href={a.source_url} target="_blank" rel="noreferrer">
                      Source: {a.source_url}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AlertTimeline alerts={alerts} />
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}
