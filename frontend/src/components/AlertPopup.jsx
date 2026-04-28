import { useEffect, useRef } from 'react';
import RiskBadge from './RiskBadge.jsx';
import SourcePill from './SourcePill.jsx';
import { useApp } from '../state/AppContext.jsx';

// Procedurally generates a short alert chime using WebAudio — no asset needed.
function playAlertSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 660, 1100].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, now + i * 0.18);
      g.gain.setValueAtTime(0.0001, now + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.18, now + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.22);
      o.connect(g).connect(ctx.destination);
      o.start(now + i * 0.18);
      o.stop(now + i * 0.18 + 0.25);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {}
}

export default function AlertPopup() {
  const { popupAlert, dismissPopup } = useApp();
  const playedRef = useRef(false);

  useEffect(() => {
    if (popupAlert && !playedRef.current) {
      playedRef.current = true;
      playAlertSound();
    }
    if (!popupAlert) playedRef.current = false;
  }, [popupAlert]);

  if (!popupAlert) return null;

  return (
    <div className="modal-backdrop fade-in" role="alertdialog" aria-modal="true" onClick={dismissPopup}>
      <div className="modal glass alert-modal pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-glow" aria-hidden />
        <div className="modal-header">
          <span className="modal-icon pulse">🚨</span>
          <div>
            <div className="modal-title">High-risk match detected</div>
            <div className="modal-subtitle">Take action on your digital footprint.</div>
          </div>
        </div>
        <div className="modal-body">
          <div className="modal-row">
            <RiskBadge level={popupAlert.risk_level} />
            <span className="muted">Risk score {popupAlert.risk_score}/100</span>
          </div>
          <p>{popupAlert.explanation}</p>
          {popupAlert.source_domain && <SourcePill scan={popupAlert} compact />}
          {Array.isArray(popupAlert.detected_misuse_types) && popupAlert.detected_misuse_types.length > 0 && (
            <div className="chips">
              {popupAlert.detected_misuse_types.map((t) => (
                <span key={t} className="chip">{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={dismissPopup}>Dismiss</button>
          <a className="btn primary glow-btn" href="/alerts" onClick={dismissPopup}>View all alerts</a>
        </div>
      </div>
    </div>
  );
}
