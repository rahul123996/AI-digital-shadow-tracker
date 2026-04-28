import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useApp } from '../state/AppContext.jsx';

const STARTER = [
  'Is this content safe?',
  'Why is this high risk?',
  'What should I do next?',
];

export default function AIAssistant() {
  const { scans } = useApp();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi — I\'m your AI security analyst. Ask me about any of your scans, or use a quick prompt below.' },
  ]);
  const scrollRef = useRef(null);
  const latestScan = scans[0] || null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const ask = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || thinking) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: trimmed }]);
    setThinking(true);
    try {
      const r = await api.assistant({ message: trimmed, scan: latestScan });
      const reply = r?.data?.reply || 'I had no answer this time. Try rephrasing your question.';
      const source = r?.data?.source || 'fallback';
      setMessages((m) => [...m, { role: 'assistant', text: reply, source }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: `Sorry — the assistant is offline (${err.message || 'error'}).`, source: 'error' }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      <button
        className={`assistant-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        type="button"
      >
        <span className="fab-pulse" aria-hidden />
        <span className="fab-icon">{open ? '✕' : '🤖'}</span>
      </button>
      {open && (
        <aside className="assistant-panel glass pop-in" role="dialog" aria-label="AI assistant">
          <header className="assistant-head">
            <div>
              <div className="assistant-tag">AI Assistant</div>
              <div className="assistant-sub">
                {latestScan
                  ? `Discussing your latest ${latestScan.type} scan • ${latestScan.risk_level || 'Pending'}`
                  : 'No active scan — ask anything.'}
              </div>
            </div>
            <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </header>
          <div className="assistant-msgs" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                {m.role === 'assistant' && <div className="msg-avatar">🤖</div>}
                <div className="msg-body">
                  {m.text.split('\n').map((line, j) => <div key={j}>{line}</div>)}
                  {m.source === 'fallback' && <div className="msg-meta">offline mode</div>}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="msg assistant">
                <div className="msg-avatar">🤖</div>
                <div className="msg-body typing"><span /><span /><span /></div>
              </div>
            )}
          </div>
          <div className="assistant-starters">
            {STARTER.map((s) => (
              <button key={s} className="starter-pill" type="button" onClick={() => ask(s)} disabled={thinking}>
                {s}
              </button>
            ))}
          </div>
          <form
            className="assistant-input"
            onSubmit={(e) => { e.preventDefault(); ask(); }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the AI…"
              disabled={thinking}
            />
            <button type="submit" disabled={thinking || !input.trim()}>Send</button>
          </form>
        </aside>
      )}
    </>
  );
}
