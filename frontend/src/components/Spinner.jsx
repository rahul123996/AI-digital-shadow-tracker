export default function Spinner({ label = 'Scanning…' }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <div className="spinner" />
      <div className="spinner-label">{label}</div>
    </div>
  );
}
