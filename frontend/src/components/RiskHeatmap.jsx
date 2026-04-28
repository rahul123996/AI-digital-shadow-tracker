import { useMemo } from 'react';

const LEVEL_HEAT = {
  Safe: 0.15,
  Suspicious: 0.55,
  'High Risk': 0.95,
};

export default function RiskHeatmap({ scans = [] }) {
  const cells = useMemo(() => {
    const recent = [...scans].slice(0, 24).reverse();
    while (recent.length < 24) recent.unshift(null);
    return recent.map((s, i) => {
      if (!s) return { i, intensity: 0, level: 'empty', label: 'Empty' };
      const intensity = LEVEL_HEAT[s.risk_level] ?? 0.2;
      return { i, intensity, level: s.risk_level || 'Unknown', score: s.risk_score || 0, ts: s.createdAt };
    });
  }, [scans]);

  const total = scans.length;
  const high = scans.filter((s) => s.risk_level === 'High Risk').length;

  return (
    <div className="card glass heatmap-card fade-in">
      <div className="card-head">
        <div>
          <h2>Risk Heatmap</h2>
          <div className="muted small">Visual signal across your last {Math.min(24, total)} scans</div>
        </div>
        <div className="heatmap-legend">
          <span><i className="heat-swatch low" /> Low</span>
          <span><i className="heat-swatch med" /> Medium</span>
          <span><i className="heat-swatch high" /> High</span>
        </div>
      </div>
      <div className="heatmap-grid">
        {cells.map((c) => (
          <div
            key={c.i}
            className={`heat-cell ${c.level === 'empty' ? 'empty' : ''}`}
            style={{
              '--heat': c.intensity,
            }}
            title={c.level === 'empty' ? 'No scan' : `${c.level} • score ${c.score}`}
          />
        ))}
      </div>
      <div className="heatmap-footer muted small">
        {total === 0 ? 'No data yet — run a scan to light up the grid.' : `${high} high-risk hit${high === 1 ? '' : 's'} in window.`}
      </div>
    </div>
  );
}
