export default function Timeline({ info }) {
  if (!info?.timeline?.length) return null;
  const items = [...info.timeline].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <div className="timeline-card">
      <div className="card-head">
        <h3>Content timeline</h3>
        <span className="muted small">{items.length} event{items.length === 1 ? '' : 's'}</span>
      </div>
      <ol className="timeline">
        {items.map((event, idx) => {
          const first = idx === 0;
          return (
            <li key={`${event.timestamp}-${idx}`} className={`timeline-item ${first ? 'first' : ''}`}>
              <span className={`timeline-dot ${eventClass(event.event)}`} aria-hidden />
              <div className="timeline-body">
                <div className="timeline-head">
                  <span className="timeline-title">
                    {first ? '🌱 First sighting' : '♻️ Re-uploaded'}
                    {' '}by <strong>{event.user_label || event.user_id}</strong>
                  </span>
                  <span className="muted small">{formatDate(event.timestamp)}</span>
                </div>
                <div className="muted small timeline-meta">
                  <span className={`event-badge ${eventClass(event.event)}`}>{event.event}</span>
                  {event.source_domain && <span>via {event.source_domain}</span>}
                  {event.source_category && <span>· {event.source_category}</span>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function eventClass(ev) {
  if (ev === 'live') return 'live';
  if (ev === 'upload') return 'upload';
  return 'scan';
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}
