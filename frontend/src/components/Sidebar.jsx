import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '🛰️' },
  { to: '/upload', label: 'New Scan', icon: '📤' },
  { to: '/alerts', label: 'Alerts', icon: '🚨' },
];

export default function Sidebar() {
  const { user, logout, status, alerts, live } = useApp();
  const unread = alerts.filter((a) => a.status !== 'read').length;
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('aidst.sb.collapsed') === '1'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('aidst.sb.collapsed', collapsed ? '1' : '0'); } catch {}
  }, [collapsed]);

  return (
    <>
      <button className="mobile-nav-toggle glass" onClick={() => setOpen(!open)} aria-label="Toggle menu">
        <span>{open ? '✕' : '☰'}</span>
      </button>
      <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="brand">
          <div className="brand-mark glow" aria-hidden>🛡️</div>
          {!collapsed && (
            <div>
              <div className="brand-title">Shadow Tracker</div>
              <div className="brand-subtitle">Digital footprint AI</div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="collapse-btn"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? '›' : '‹'}
        </button>

        <nav className="nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? l.label : undefined}
            >
              <span className="nav-icon" aria-hidden>{l.icon}</span>
              {!collapsed && <span>{l.label}</span>}
              {l.to === '/alerts' && unread > 0 && <span className="badge">{unread}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {live && !collapsed && (
            <div className="status-pill live">
              <span className="dot red pulsing" /> Monitoring active
            </div>
          )}
          {status && !collapsed && (
            <div className="status-pill">
              <span className={`dot ${status.firebase === 'live' ? 'green' : 'amber'}`} />
              {status.firebase === 'live' ? 'Firebase live' : 'Demo mode'}
            </div>
          )}
          <div className="user">
            <div className="avatar">{(user?.name || '?').slice(0, 1).toUpperCase()}</div>
            {!collapsed && (
              <div>
                <div className="user-name">{user?.name}</div>
                <div className="user-email">{user?.email}</div>
              </div>
            )}
          </div>
          {!collapsed ? (
            <button className="btn ghost full" onClick={logout}>Sign out</button>
          ) : (
            <button className="btn ghost full" onClick={logout} title="Sign out">⎋</button>
          )}
        </div>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
    </>
  );
}
