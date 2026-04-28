import { useState } from 'react';

export default function WhyFlagged({ result }) {
  const [open, setOpen] = useState(true);
  if (!result) return null;
  const bullets = Array.isArray(result.why_flagged) && result.why_flagged.length > 0
    ? result.why_flagged
    : [result.explanation].filter(Boolean);

  return (
    <div className={`why-flagged ${open ? 'open' : ''}`}>
      <button className="why-toggle" onClick={() => setOpen(!open)} type="button" aria-expanded={open}>
        <span className="why-title">🔍 Why was this flagged?</span>
        <span className="why-chevron" aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <ul className="why-list">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
