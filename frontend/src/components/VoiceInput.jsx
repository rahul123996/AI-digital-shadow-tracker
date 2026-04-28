import { useEffect, useRef, useState } from 'react';

export default function VoiceInput({ onTranscript, disabled }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (interimText) setInterim(interimText);
      if (finalText) {
        onTranscript?.(finalText.trim());
        setInterim('');
      }
    };
    rec.onerror = (e) => {
      setError(e.error || 'Speech recognition failed');
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      try { rec.stop(); } catch { /* noop */ }
    };
  }, [onTranscript]);

  const toggle = () => {
    setError(null);
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      try {
        setInterim('');
        rec.start();
        setListening(true);
      } catch (e) {
        setError(e.message);
      }
    }
  };

  if (!supported) {
    return (
      <div className="voice-input">
        <button type="button" className="btn ghost" disabled title="Web Speech API not supported in this browser">
          🎙️ Voice unavailable
        </button>
      </div>
    );
  }

  return (
    <div className="voice-input">
      <button
        type="button"
        className={`btn ${listening ? 'mic active' : 'ghost'}`}
        onClick={toggle}
        disabled={disabled}
        aria-pressed={listening}
      >
        <span className={`mic-dot${listening ? ' on' : ''}`} aria-hidden />
        {listening ? 'Listening… tap to stop' : '🎙️ Speak the text'}
      </button>
      {interim && <div className="muted small">Hearing: “{interim}”</div>}
      {error && <div className="alert error small">{error}</div>}
    </div>
  );
}
