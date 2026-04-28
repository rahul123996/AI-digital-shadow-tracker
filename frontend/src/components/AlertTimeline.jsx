function fmt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

export default function AlertTimeline({ alerts = [] }) {
  if (!alerts.length) return null;
  return (
    <div className="card glass fade-in">
      <div className="card-head">
        <h2>Alert history timeline</h2>
        <span className="muted small">{alerts.length} total</span>
      </div>
      <ul className="alert-timeline">
        {alerts.slice(0, 12).map((a, i) => (
          <li key={a.id || i} className="alert-tl-item">
            <span className="alert-tl-dot" />
            <div className="alert-tl-body">
              <div className="alert-tl-head">
                <strong>{a.type}</strong>
                <span className="muted small">{fmt(a.createdAt)}</span>
              </div>
              <div className="alert-tl-text">{a.message}</div>
              {a.source_url && (
                <a className="link" href={a.source_url} target="_blank" rel="noreferrer">{a.source_url}</a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
