export default function DuplicateBanner({ info, compact = false }) {
  if (!info?.is_duplicate) return null;
  const occurrences = info.occurrence_count || 0;
  const users = info.unique_users || 0;
  const sources = info.external_sources?.length || 0;

  if (compact) {
    return (
      <span className="dup-pill" title={`Seen ${occurrences} times across ${users} users`}>
        ♻️ Duplicate · ×{occurrences}
        {users > 1 && <span className="muted"> · {users} users</span>}
      </span>
    );
  }

  return (
    <div className="duplicate-banner pop-in">
      <div className="dup-icon" aria-hidden>♻️</div>
      <div className="dup-body">
        <div className="dup-title">Duplicate content detected</div>
        <p className="dup-text">
          This exact content has already been seen <strong>{occurrences}</strong> time{occurrences === 1 ? '' : 's'}
          {users > 1 && <> across <strong>{users}</strong> different users</>}
          {sources > 0 && <> on <strong>{sources}</strong> external source{sources === 1 ? '' : 's'}</>}.
          The risk score has been boosted to reflect repeated usage.
        </p>
        {info.previous_uploaders?.length > 0 && (
          <div className="dup-prev">
            <span className="muted small">Previously uploaded by:</span>
            <ul className="dup-prev-list">
              {info.previous_uploaders.slice(0, 4).map((p) => (
                <li key={`${p.user_id}-${p.timestamp}`}>
                  <span className="avatar tiny" aria-hidden>
                    {(p.user_label || p.user_id || '?').slice(0, 1).toUpperCase()}
                  </span>
                  <strong>{p.user_label || p.user_id}</strong>
                  <span className="muted small"> · {formatDate(p.timestamp)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}
