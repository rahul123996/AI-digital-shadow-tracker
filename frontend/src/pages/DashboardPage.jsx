import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import RiskBadge from '../components/RiskBadge.jsx';
import RiskCharts from '../components/RiskCharts.jsx';
import LiveMonitor from '../components/LiveMonitor.jsx';
import SourcePill from '../components/SourcePill.jsx';
import DuplicateBanner from '../components/DuplicateBanner.jsx';
import AlertPopup from '../components/AlertPopup.jsx';
import HeroBanner from '../components/HeroBanner.jsx';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import RiskHeatmap from '../components/RiskHeatmap.jsx';
import IdentityScore from '../components/IdentityScore.jsx';
import ActivityFeed from '../components/ActivityFeed.jsx';
import { SkeletonRow } from '../components/Skeleton.jsx';
import { useApp } from '../state/AppContext.jsx';

export default function DashboardPage() {
  const { scans, alerts, user, refresh, loading } = useApp();

  const stats = useMemo(() => {
    const total = scans.length;
    const high = scans.filter((s) => s.risk_level === 'High Risk').length;
    const suspicious = scans.filter((s) => s.risk_level === 'Suspicious').length;
    const safe = scans.filter((s) => s.risk_level === 'Safe').length;
    const duplicates = scans.filter((s) => s.is_duplicate).length;
    return { total, high, suspicious, safe, duplicates, alerts: alerts.length };
  }, [scans, alerts]);

  return (
    <div className="page">
      <HeroBanner user={user} />

      <header className="page-header row">
        <div>
          <h1 className="section-title">Mission control</h1>
          <p className="muted">A live overview of your monitored digital footprint.</p>
        </div>
        <div className="header-actions">
          <button className="btn ghost" onClick={refresh}>↻ Refresh</button>
          <Link className="btn primary glow-btn" to="/upload">+ New scan</Link>
        </div>
      </header>

      <LiveMonitor />

      <section className="stats">
        <StatCard label="Total scans" value={stats.total} accent="blue" icon="🛰️" />
        <StatCard label="High risk" value={stats.high} accent="red" icon="🚨" glow={stats.high > 0} />
        <StatCard label="Suspicious" value={stats.suspicious} accent="amber" icon="⚠️" glow={stats.suspicious > 0} />
        <StatCard label="Duplicates" value={stats.duplicates} accent="violet" icon="♻️" glow={stats.duplicates > 0} />
      </section>

      <section className="dual-grid">
        <IdentityScore />
        <RiskHeatmap scans={scans} />
      </section>

      <RiskCharts scans={scans} />

      <section className="dual-grid">
        <ActivityFeed scans={scans} />
        <section className="card glass">
          <div className="card-head">
            <h2>Recent scans</h2>
            <Link to="/upload" className="link">Run new scan →</Link>
          </div>
          {loading && scans.length === 0 ? (
            <div className="scan-list">
              <SkeletonRow /><SkeletonRow /><SkeletonRow />
            </div>
          ) : scans.length === 0 ? (
            <Empty title="No scans yet" body="Upload an image, paste text, or enable live monitoring to see Gemini's analysis here." cta={<Link className="btn primary" to="/upload">Start a scan</Link>} />
          ) : (
            <div className="scan-list">
              {scans.slice(0, 8).map((s) => (
                <article key={s.id} className={`scan-row fade-in ${s.live ? 'live' : ''} ${s.is_duplicate ? 'duplicate' : ''}`}>
                  <div className="scan-icon" aria-hidden>{s.type === 'image' ? '📷' : '📝'}</div>
                  <div className="scan-body">
                    <div className="scan-line">
                      <div className="scan-subject ellipsis">
                        {s.type === 'image' ? (s.fileName || s.imageUrl) : (s.text || '—')}
                      </div>
                      <RiskBadge level={s.risk_level} />
                    </div>
                    <div className="scan-meta muted small">
                      <span>Similarity {Math.round((s.similarity_score || 0) * 100)}%</span>
                      {s.confidence_score != null && <span>Confidence {s.confidence_score}%</span>}
                      <SourcePill scan={s} compact />
                      <DuplicateBanner info={s.duplicate_info} compact />
                      <span>{formatDate(s.createdAt)}</span>
                      {s.live && <span className="badge-live">LIVE</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <AlertPopup />
    </div>
  );
}

function StatCard({ label, value, accent, icon, glow }) {
  return (
    <div className={`stat-card glass ${accent} ${glow ? 'glow-card' : ''} fade-in`}>
      <div className="stat-icon" aria-hidden>{icon}</div>
      <div className="stat-value"><AnimatedCounter value={value} /></div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Empty({ title, body, cta }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden>🛡️</div>
      <h3>{title}</h3>
      <p className="muted">{body}</p>
      {cta}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}
