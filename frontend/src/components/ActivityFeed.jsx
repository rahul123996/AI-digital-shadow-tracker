function timeAgo(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const LEVEL_DOT = {
  'High Risk': 'red',
  Suspicious: 'amber',
  Safe: 'green',
};

export default function ActivityFeed({ scans = [] }) {
  const items = scans.slice(0, 6);
  return (
    <div className="card glass fade-in">
      <div className="card-head">
        <div>
          <h2>Live activity feed</h2>
          <div className="muted small">Latest scans, ordered newest first</div>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="muted small" style={{ padding: 8 }}>Nothing scanned yet.</div>
      ) : (
        <ul className="activity-feed">
          {items.map((s) => (
            <li key={s.id} className={`feed-item ${s.live ? 'live' : ''}`}>
              <span className={`feed-dot ${LEVEL_DOT[s.risk_level] || 'muted'}`} />
              <div className="feed-body">
                <div className="feed-line">
                  <span className="feed-icon" aria-hidden>{s.type === 'image' ? '📷' : '📝'}</span>
                  <span className="feed-text ellipsis">
                    {s.type === 'image' ? (s.fileName || s.imageUrl) : (s.text || '—')}
                  </span>
                  {s.live && <span className="badge-live">LIVE</span>}
                </div>
                <div className="feed-meta muted small">
                  {s.risk_level || 'Pending'} · score {s.risk_score || 0} · {timeAgo(s.createdAt)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
