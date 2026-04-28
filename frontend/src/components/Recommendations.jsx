import { useState } from 'react';

const ICONS = { report: '🚨', investigate: '🔎', monitor: '👁️' };

export default function Recommendations({ recommendations }) {
  const [chosen, setChosen] = useState(null);
  if (!recommendations) return null;
  const { primary, label, summary, urgency, steps = [], options = [] } = recommendations;
  return (
    <div className={`recommendations glass urgency-${urgency} fade-in`}>
      <div className="rec-head">
        <span className="rec-icon">{ICONS[primary] || '✨'}</span>
        <div>
          <div className="rec-tag">Smart Recommendation</div>
          <h3>{label}</h3>
        </div>
        <span className={`rec-urgency ${urgency}`}>{urgency}</span>
      </div>
      <p className="rec-summary">{summary}</p>
      {steps.length > 0 && (
        <ol className="rec-steps">
          {steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      )}
      <div className="rec-actions">
        {options.map((o) => (
          <button
            key={o.id}
            className={`rec-btn ${chosen === o.id ? 'chosen' : ''} ${o.id === primary ? 'primary' : ''}`}
            onClick={() => setChosen(o.id)}
            type="button"
          >
            {chosen === o.id ? '✓ ' : ''}{o.label}
          </button>
        ))}
      </div>
      {chosen && (
        <div className="rec-confirm">Action queued: <strong>{chosen.toUpperCase()}</strong>. We'll keep watching this fingerprint.</div>
      )}
    </div>
  );
}
