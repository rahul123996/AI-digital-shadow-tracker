export default function PreviewRisk({ preview }) {
  if (!preview) return null;
  const tone = preview.predicted_level === 'High Risk'
    ? 'high'
    : preview.predicted_level === 'Suspicious' ? 'warn' : 'safe';
  return (
    <div className={`preview-risk ${tone}`}>
      <div className="preview-row">
        <span className="preview-icon" aria-hidden>🤖</span>
        <span className="preview-text">{preview.message}</span>
      </div>
      <div className="preview-bar">
        <div className="preview-fill" style={{ width: `${preview.predicted_risk}%` }} />
      </div>
      <div className="muted small">Predicted level: {preview.predicted_level}</div>
    </div>
  );
}
