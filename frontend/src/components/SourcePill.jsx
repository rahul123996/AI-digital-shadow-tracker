export default function SourcePill({ scan, compact = false }) {
  if (!scan?.source_domain) return null;
  if (compact) {
    return (
      <span className="source-pill compact" title={scan.source_url}>
        🌐 {scan.source_domain}
        {scan.confidence_score != null && <span className="muted"> · {scan.confidence_score}%</span>}
      </span>
    );
  }
  return (
    <div className="source-pill">
      <div className="source-row">
        <span className="source-icon" aria-hidden>🌐</span>
        <div>
          <div className="source-label muted small">Source found on</div>
          <a className="source-domain" href={scan.source_url} target="_blank" rel="noreferrer">
            {scan.source_domain}
          </a>
          {scan.source_category && (
            <div className="muted small">{scan.source_category}</div>
          )}
        </div>
      </div>
      {scan.confidence_score != null && (
        <div className="confidence">
          <div className="confidence-label muted small">Confidence</div>
          <div className="confidence-bar">
            <div className="confidence-fill" style={{ width: `${scan.confidence_score}%` }} />
          </div>
          <div className="confidence-value">{scan.confidence_score}%</div>
        </div>
      )}
    </div>
  );
}
