import { useApp } from '../state/AppContext.jsx';

export default function HeroBanner({ user }) {
  const { live, status } = useApp();
  const firebaseLive = status?.firebase === 'live';
  return (
    <section className="hero-banner glass">
      <div className="hero-orb" aria-hidden />
      <div className="hero-grid" aria-hidden />
      <div className="hero-content">
        <div className="hero-tag">
          <span className={`live-dot ${live ? 'on' : 'idle'}`} />
          {live ? 'Monitoring active' : 'Standing by'}
        </div>
        <h1 className="hero-title">
          AI Digital <span className="text-grad">Shadow Tracker</span>
        </h1>
        <p className="hero-sub">
          Welcome back, <strong>{user?.name || 'analyst'}</strong> — your personal
          AI sentinel is watching the open web for misuse of your content.
        </p>
        <div className="hero-meta">
          <span className="meta-pill">
            <span className={`mini-dot ${firebaseLive ? 'green' : 'amber'}`} />
            {firebaseLive ? 'Firebase live' : 'Demo mode'}
          </span>
          <span className="meta-pill">
            <span className="mini-dot violet" />
            Gemini AI engine
          </span>
          <span className="meta-pill">
            <span className="mini-dot cyan" />
            Cross-source intelligence
          </span>
        </div>
      </div>
    </section>
  );
}
