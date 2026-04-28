import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';

export default function LoginPage() {
  const { login, user } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const submit = (e) => {
    e.preventDefault();
    if (!email) return;
    login({ name: name || email.split('@')[0], email });
    navigate('/dashboard');
  };

  return (
    <div className="auth-shell">
      <div className="bg-aurora" aria-hidden />
      <div className="auth-hero page-fade">
        <div className="brand-mark big glow" aria-hidden>🛡️</div>
        <div className="hero-tag inline">
          <span className="live-dot on" /> AI sentinel online
        </div>
        <h1>
          AI Digital <span className="text-grad">Shadow Tracker</span>
        </h1>
        <p>
          Monitor where your photos, content and personal data show up across the
          internet. Powered by Gemini-driven risk analysis and image-similarity
          scanning.
        </p>
        <ul className="hero-points">
          <li>📤 Upload an image or text snippet</li>
          <li>🧠 Gemini explains how it might be misused</li>
          <li>🚨 Get instant alerts on high-risk matches</li>
          <li>🤖 Built-in AI assistant answers your questions</li>
        </ul>
      </div>

      <form className="auth-card glass page-fade" onSubmit={submit}>
        <div className="tabs">
          <button type="button" className={mode === 'login' ? 'tab active' : 'tab'} onClick={() => setMode('login')}>Sign in</button>
          <button type="button" className={mode === 'register' ? 'tab active' : 'tab'} onClick={() => setMode('register')}>Register</button>
        </div>

        {mode === 'register' && (
          <label className="field">
            <span>Name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="(demo — any value)" />
        </label>

        <button className="btn primary full" type="submit">
          {mode === 'login' ? 'Continue' : 'Create account'}
        </button>
        <p className="muted small center">
          Demo authentication — no password is stored. A workspace is created for the email you enter.
        </p>
      </form>
    </div>
  );
}
