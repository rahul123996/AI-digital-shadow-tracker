export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card skeleton-card">
      <div className="skel skel-line w-40" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skel skel-line" style={{ width: `${60 + Math.random() * 30}%` }} />
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="stat-card skeleton-card">
      <div className="skel skel-circle" />
      <div className="skel skel-line w-30" />
      <div className="skel skel-line w-50" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="scan-row skeleton-card">
      <div className="skel skel-circle" />
      <div className="scan-body" style={{ gap: 8 }}>
        <div className="skel skel-line" style={{ width: '70%' }} />
        <div className="skel skel-line" style={{ width: '40%' }} />
      </div>
    </div>
  );
}
