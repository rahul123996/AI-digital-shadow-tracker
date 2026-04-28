import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';

const AppContext = createContext(null);
const STORAGE_KEY = 'aidst.user';
const LIVE_INTERVAL_MS = 7000;

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [scans, setScans] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupAlert, setPopupAlert] = useState(null);
  const [status, setStatus] = useState(null);
  const [live, setLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState('idle'); // idle | scanning | ok
  const liveTimer = useRef(null);

  useEffect(() => {
    api.status().then(setStatus).catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [r, a] = await Promise.all([
        api.results(user.id),
        api.alerts(user.id),
      ]);
      setScans(r.data || []);
      setAlerts(a.data || []);
    } catch (err) {
      console.warn('refresh failed', err);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(({ name, email }) => {
    const safeName = (name || email.split('@')[0] || 'demo').trim();
    const id = `user-${safeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    setUser({ id, name: safeName, email });
  }, []);

  const logout = useCallback(() => {
    stopLive();
    setUser(null);
    setScans([]);
    setAlerts([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runImageScan = useCallback(async ({ file, context, onProgress }) => {
    if (!user) throw new Error('Not logged in');
    setLoading(true);
    try {
      const upload = await api.uploadFile(file, user.id, onProgress, user.name);
      const scan = await api.scanImage({
        userId: user.id,
        userLabel: user.name,
        imageUrl: upload.data.publicUrl,
        fileName: upload.data.fileName,
        fingerprint: upload.data.fingerprint,
        context,
      });
      await refresh();
      if (scan.data?.risk_level === 'High Risk') setPopupAlert(scan.data);
      return scan.data;
    } finally {
      setLoading(false);
    }
  }, [user, refresh]);

  const runTextScan = useCallback(async ({ text, context }) => {
    if (!user) throw new Error('Not logged in');
    setLoading(true);
    try {
      const scan = await api.scanText({
        userId: user.id, userLabel: user.name, text, context,
      });
      await refresh();
      if (scan.data?.risk_level === 'High Risk') setPopupAlert(scan.data);
      return scan.data;
    } finally {
      setLoading(false);
    }
  }, [user, refresh]);

  const previewRisk = useCallback(async ({ type, text, fileName, context }) => {
    try {
      const r = await api.scanPreview({ type, text, fileName, context });
      return r.data;
    } catch {
      return null;
    }
  }, []);

  const stopLive = useCallback(() => {
    if (liveTimer.current) clearInterval(liveTimer.current);
    liveTimer.current = null;
    setLive(false);
    setLiveStatus('idle');
  }, []);

  const startLive = useCallback(() => {
    if (!user || liveTimer.current) return;
    setLive(true);
    setLiveStatus('scanning');
    const tick = async () => {
      setLiveStatus('scanning');
      try {
        const r = await api.scanLive({ userId: user.id, userLabel: user.name });
        await refresh();
        if (r.data?.risk_level === 'High Risk') setPopupAlert(r.data);
        setLiveStatus('ok');
      } catch (err) {
        console.warn('live scan failed', err);
        setLiveStatus('idle');
      }
    };
    tick();
    liveTimer.current = setInterval(tick, LIVE_INTERVAL_MS);
  }, [user, refresh]);

  useEffect(() => () => {
    if (liveTimer.current) clearInterval(liveTimer.current);
  }, []);

  const value = useMemo(
    () => ({
      user, scans, alerts, loading, status, popupAlert,
      live, liveStatus,
      login, logout, refresh,
      runImageScan, runTextScan, previewRisk,
      startLive, stopLive,
      dismissPopup: () => setPopupAlert(null),
    }),
    [user, scans, alerts, loading, status, popupAlert, live, liveStatus,
      login, logout, refresh, runImageScan, runTextScan, previewRisk, startLive, stopLive],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
