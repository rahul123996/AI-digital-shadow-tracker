import { useEffect, useState } from 'react';
import { useApp } from '../state/AppContext.jsx';

export default function LiveMonitor() {
  const { live, liveStatus, startLive, stopLive } = useApp();
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setPulse((p) => (p + 1) % 100), 800);
    return () => clearInterval(t);
  }, [live]);

  return (
    <div className={`live-monitor glass ${live ? 'active' : ''}`}>
      <div className="radar" aria-hidden>
        <span className="radar-ring r1" />
        <span className="radar-ring r2" />
        <span className="radar-ring r3" />
        <span className="radar-core" />
        {live && <span className="radar-sweep" />}
      </div>
      <div className="live-meta">
        <div className="live-title">
          <span className={`live-dot ${live ? 'on' : ''}`} aria-hidden />
          {live ? 'Monitoring active' : 'Live monitoring'}
        </div>
        <div className="muted small">
          {live
            ? liveStatus === 'scanning'
              ? `Scanning incoming data${'.'.repeat((pulse % 3) + 1)}`
              : 'Polling every 7s for new matches.'
            : 'Simulates incoming internet matches and scans them in the background.'}
        </div>
      </div>
      {live ? (
        <button className="btn ghost" onClick={stopLive}>Stop monitoring</button>
      ) : (
        <button className="btn primary glow-btn" onClick={startLive}>▶ Start live monitoring</button>
      )}
    </div>
  );
}
