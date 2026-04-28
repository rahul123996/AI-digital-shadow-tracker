export default function SourceList({ sources }) {
  if (!Array.isArray(sources) || sources.length === 0) return null;
  return (
    <div className="source-list-card">
      <div className="card-head">
        <h3>Detected sources</h3>
        <span className="muted small">{sources.length} match{sources.length === 1 ? '' : 'es'}</span>
      </div>
      <ul className="source-list">
        {sources.map((s, i) => (
          <li key={`${s.kind}-${s.label}-${i}`} className={`source-item ${s.kind}`}>
            <div className="source-kind" aria-hidden>{s.kind === 'external' ? '🌐' : '👤'}</div>
            <div className="source-info">
              <div className="source-line">
                {s.url ? (
                  <a className="source-domain" href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
                ) : (
                  <span className="source-domain">{s.label}</span>
                )}
                <span className={`kind-tag ${s.kind}`}>{s.kind === 'external' ? 'External site' : 'Internal user'}</span>
              </div>
              {s.detail && <div className="muted small">{s.detail}</div>}
              {s.timestamp && <div className="muted small">{formatDate(s.timestamp)}</div>}
            </div>
            {s.confidence_score != null && (
              <div className="source-confidence">
                <div className="confidence-bar small">
                  <div className="confidence-fill" style={{ width: `${s.confidence_score}%` }} />
                </div>
                <div className="confidence-value">{s.confidence_score}%</div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}
