import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RiskBadge from '../components/RiskBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import AlertPopup from '../components/AlertPopup.jsx';
import VoiceInput from '../components/VoiceInput.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import PreviewRisk from '../components/PreviewRisk.jsx';
import WhyFlagged from '../components/WhyFlagged.jsx';
import SourcePill from '../components/SourcePill.jsx';
import DuplicateBanner from '../components/DuplicateBanner.jsx';
import Timeline from '../components/Timeline.jsx';
import SourceList from '../components/SourceList.jsx';
import Recommendations from '../components/Recommendations.jsx';
import { useApp } from '../state/AppContext.jsx';

export default function UploadPage() {
  const { runImageScan, runTextScan, previewRisk, loading } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [mode, setMode] = useState('image');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [statusText, setStatusText] = useState('');
  const [previewRiskInfo, setPreviewRiskInfo] = useState(null);
  const [autoScanFromVoice, setAutoScanFromVoice] = useState(false);
  const [dragging, setDragging] = useState(false);

  const onPick = (f) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
    setResult(null);
    setError(null);
    setPreviewRiskInfo(null);
  };

  // Pre-scan: trigger a quick risk preview as the user provides input.
  useEffect(() => {
    setPreviewRiskInfo(null);
    let cancelled = false;
    const subject = mode === 'image'
      ? (file ? { type: 'image', fileName: file.name } : null)
      : (text.trim() ? { type: 'text', text } : null);
    if (!subject) return;
    const id = setTimeout(async () => {
      const r = await previewRisk({ ...subject, context });
      if (!cancelled) setPreviewRiskInfo(r);
    }, 350);
    return () => { cancelled = true; clearTimeout(id); };
  }, [mode, file, text, context, previewRisk]);

  const submit = async (e) => {
    e?.preventDefault?.();
    setError(null);
    setResult(null);
    setProgress(null);
    try {
      if (mode === 'image') {
        if (!file) return setError('Please choose an image to scan.');
        setStatusText('Uploading…');
        setProgress(0);
        const r = await runImageScan({
          file,
          context,
          onProgress: (p) => setProgress(p),
        });
        setStatusText('Analysing with Gemini…');
        setProgress(100);
        setResult(r);
      } else {
        if (!text.trim()) return setError('Please enter the text to scan.');
        setStatusText('Analysing with Gemini…');
        setProgress(40);
        const r = await runTextScan({ text, context });
        setProgress(100);
        setResult(r);
      }
    } catch (err) {
      setError(err.message || 'Scan failed.');
    } finally {
      setStatusText('');
      setTimeout(() => setProgress(null), 800);
    }
  };

  // When voice input fires, auto-submit the text scan.
  useEffect(() => {
    if (autoScanFromVoice && text.trim()) {
      setAutoScanFromVoice(false);
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoScanFromVoice]);

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="section-title">New <span className="text-grad">AI Scan</span></h1>
        <p className="muted">
          Upload an image or paste a text snippet, optionally describe where you
          found it, and let Gemini classify the risk.
        </p>
      </header>

      <div className="card glass fade-in">
        <div className="tabs inline">
          <button className={mode === 'image' ? 'tab active' : 'tab'} onClick={() => setMode('image')} type="button">📷 Image</button>
          <button className={mode === 'text' ? 'tab active' : 'tab'} onClick={() => setMode('text')} type="button">📝 Text</button>
        </div>

        <form onSubmit={submit} className="form">
          {mode === 'image' ? (
            <div
              className={`dropzone${preview ? ' has-preview' : ''}${dragging ? ' dragging' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); onPick(e.dataTransfer.files?.[0]); }}
              role="button"
              tabIndex={0}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onPick(e.target.files?.[0])}
              />
              {preview ? (
                <img src={preview} alt="Selected preview" className="preview" />
              ) : (
                <div className="dropzone-empty">
                  <div className="dropzone-icon" aria-hidden>📁</div>
                  <div><strong>Click to upload</strong> or drag &amp; drop an image</div>
                  <div className="muted small">PNG, JPG up to 5 MB</div>
                </div>
              )}
            </div>
          ) : (
            <>
              <label className="field">
                <span>Text snippet</span>
                <textarea
                  rows={5}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste the text you want to check (email, paragraph, profile bio, etc.)"
                  disabled={loading}
                />
              </label>
              <VoiceInput
                disabled={loading}
                onTranscript={(t) => {
                  setText((prev) => (prev ? `${prev} ${t}` : t));
                  setAutoScanFromVoice(true);
                }}
              />
            </>
          )}

          <label className="field">
            <span>Where did you find it? <span className="muted">(optional)</span></span>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. Found on a suspicious crypto investment site"
              disabled={loading}
            />
          </label>

          {previewRiskInfo && !result && <PreviewRisk preview={previewRiskInfo} />}

          {error && <div className="alert error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn ghost" onClick={() => navigate('/dashboard')} disabled={loading}>Cancel</button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? (statusText || 'Scanning…') : 'Run AI Scan'}
            </button>
          </div>

          {(loading || progress != null) && (
            <ProgressBar value={progress ?? 5} label={statusText || 'Working…'} />
          )}
        </form>
      </div>

      {loading && <Spinner label={statusText || 'Talking to the AI engine…'} />}

      {result && (
        <div className={`card result glass fade-in result-${(result.risk_level || 'safe').toLowerCase().replace(/\s/g, '-')}`}>
          <div className="result-head">
            <h2>Scan result</h2>
            <RiskBadge level={result.risk_level} />
          </div>
          <div className="risk-bar-wrap">
            <div className="risk-bar"><span style={{ width: `${Math.max(4, result.risk_score || 0)}%` }} /></div>
            <div className="risk-bar-label">{result.risk_score || 0}/100</div>
          </div>

          <div className="result-grid">
            {mode === 'image' && preview && (
              <img src={preview} alt="Scanned" className="result-image" />
            )}
            <div className="result-meta">
              <Metric label="Similarity" value={`${Math.round((result.similarity_score || 0) * 100)}%`} />
              <Metric label="Risk score" value={`${result.risk_score ?? 0}/100`} />
              <Metric label="Misuse detected" value={result.misuse_detected ? 'Yes' : 'No'} />
              {result.confidence_score != null && (
                <Metric label="Confidence" value={`${result.confidence_score}%`} />
              )}
              {result.source && <Metric label="Engine" value={result.source} />}
            </div>
          </div>

          <SourcePill scan={result} />

          <DuplicateBanner info={result.duplicate_info} />

          <Recommendations recommendations={result.recommendations} />

          <p className="explanation">{result.explanation}</p>

          {Array.isArray(result.detected_misuse_types) && result.detected_misuse_types.length > 0 && (
            <div className="chips">
              {result.detected_misuse_types.map((t) => <span key={t} className="chip">{t}</span>)}
            </div>
          )}

          <SourceList sources={result.sources_found} />

          <Timeline info={result.duplicate_info} />

          <WhyFlagged result={result} />

          <div className="form-actions">
            <button className="btn ghost" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
            <button className="btn primary" onClick={() => navigate('/alerts')}>View alerts</button>
          </div>
        </div>
      )}

      <AlertPopup />
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}
