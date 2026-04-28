import { useEffect, useState } from 'react';
import AnimatedCounter from './AnimatedCounter.jsx';
import { useApp } from '../state/AppContext.jsx';
import { api } from '../lib/api.js';

export default function IdentityScore() {
  const { user, scans } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    setLoading(true);
    api.identityScore(user.id)
      .then((r) => { if (alive) setData(r.data || null); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // refetch when scan history changes
  }, [user?.id, scans.length]);

  const score = data?.score ?? 100;
  const grade = data?.grade ?? 'A';
  const label = data?.label ?? 'Pristine';
  const trend = data?.trend ?? 'flat';
  const summary = data?.summary ?? 'Your digital safety score appears here.';

  // Map score → color band
  let band = 'good';
  if (score < 50) band = 'bad';
  else if (score < 75) band = 'warn';

  // Build SVG ring
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className={`card glass identity-card ${band} fade-in`}>
      <div className="identity-head">
        <div>
          <div className="identity-tag">Digital Safety Score</div>
          <h2 className="identity-label">{label}</h2>
        </div>
        <div className={`trend trend-${trend}`}>
          {trend === 'up' && '↑ improving'}
          {trend === 'down' && '↓ declining'}
          {trend === 'flat' && '— stable'}
        </div>
      </div>
      <div className="identity-body">
        <div className="ring-wrap">
          <svg viewBox="0 0 120 120" className="ring">
            <defs>
              <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r={r} className="ring-track" />
            <circle
              cx="60" cy="60" r={r}
              className="ring-bar"
              strokeDasharray={c}
              strokeDashoffset={loading ? c : offset}
            />
          </svg>
          <div className="ring-center">
            <div className="ring-score">
              <AnimatedCounter value={loading ? 0 : score} />
            </div>
            <div className="ring-grade">{grade}</div>
          </div>
        </div>
        <div className="identity-meta">
          <p className="identity-summary">{summary}</p>
          {data?.breakdown && (
            <div className="identity-breakdown">
              <span><b>{data.breakdown.high}</b> high</span>
              <span><b>{data.breakdown.suspicious}</b> susp.</span>
              <span><b>{data.breakdown.safe}</b> safe</span>
              <span><b>{data.breakdown.duplicates}</b> dupes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
