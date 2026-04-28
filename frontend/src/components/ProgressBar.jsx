export default function ProgressBar({ value, label }) {
  if (value == null) return null;
  return (
    <div className="progress-bar">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <div className="progress-meta muted small">
        <span>{label || 'Progress'}</span>
        <span>{value}%</span>
      </div>
    </div>
  );
}
