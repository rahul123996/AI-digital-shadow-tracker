import { useMemo } from 'react';
import {
  Bar, BarChart, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const RISK_COLORS = {
  Safe: '#22c55e',
  Suspicious: '#f59e0b',
  'High Risk': '#ef4444',
  Unknown: '#64748b',
};

export default function RiskCharts({ scans }) {
  const { pie, bars } = useMemo(() => {
    const counts = { Safe: 0, Suspicious: 0, 'High Risk': 0 };
    for (const s of scans) {
      const lvl = counts[s.risk_level] !== undefined ? s.risk_level : null;
      if (lvl) counts[lvl] += 1;
    }
    const pie = Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    const recent = [...scans].slice(0, 8).reverse();
    const bars = recent.map((s, idx) => ({
      name: `#${idx + 1}`,
      score: Math.round((s.similarity_score || 0) * 100),
      risk: s.risk_level || 'Unknown',
    }));
    return { pie, bars };
  }, [scans]);

  const totalScans = scans.length;
  const hasPie = pie.length > 0;
  const hasBars = bars.length > 0;

  return (
    <div className="charts-grid">
      <div className="chart-card">
        <div className="chart-head">
          <h3>Risk distribution</h3>
          <span className="muted small">{totalScans} total</span>
        </div>
        {hasPie ? (
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={88}
                  paddingAngle={2}
                  stroke="none"
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {pie.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f1530', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                  itemStyle={{ color: '#e6ecff' }}
                />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-empty muted">Run a few scans to see the distribution.</div>
        )}
      </div>

      <div className="chart-card">
        <div className="chart-head">
          <h3>Recent similarity scores</h3>
          <span className="muted small">last {bars.length}</span>
        </div>
        {hasBars ? (
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bars} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#0f1530', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                  itemStyle={{ color: '#e6ecff' }}
                  formatter={(value, _name, ctx) => [`${value}%`, ctx?.payload?.risk || 'Risk']}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {bars.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.risk] || RISK_COLORS.Unknown} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-empty muted">Recent similarity scores will appear here.</div>
        )}
      </div>
    </div>
  );
}
