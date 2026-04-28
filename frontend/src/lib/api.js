async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }
  if (!res.ok) {
    const message = payload?.error?.message || payload?.error || res.statusText;
    throw new Error(typeof message === 'string' ? message : 'Request failed');
  }
  return payload;
}

export const api = {
  status: () => request('/api/status'),
  uploadFile: async (file, userId, onProgress, userLabel) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('userId', userId);
    if (userLabel) fd.append('userLabel', userLabel);
    if (typeof onProgress === 'function' && typeof XMLHttpRequest !== 'undefined') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); }
            catch { resolve({}); }
          } else {
            reject(new Error(xhr.responseText || 'Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(fd);
      });
    }
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  scanImage: ({ userId, userLabel, imageUrl, fileName, fingerprint, context }) =>
    request('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ userId, userLabel, imageUrl, fileName, fingerprint, context }),
    }),
  scanText: ({ userId, userLabel, text, context }) =>
    request('/api/scan/text', {
      method: 'POST',
      body: JSON.stringify({ userId, userLabel, text, context }),
    }),
  scanPreview: ({ type, text, fileName, context }) =>
    request('/api/scan/preview', {
      method: 'POST',
      body: JSON.stringify({ type, text, fileName, context }),
    }),
  scanLive: ({ userId, userLabel }) =>
    request('/api/scan/live', {
      method: 'POST',
      body: JSON.stringify({ userId, userLabel }),
    }),
  results: (userId) => request(`/api/results?userId=${encodeURIComponent(userId)}`),
  alerts: (userId) => request(`/api/alerts?userId=${encodeURIComponent(userId)}`),
  alert: (payload) =>
    request('/api/alert', { method: 'POST', body: JSON.stringify(payload) }),
  identityScore: (userId) => request(`/api/identity-score?userId=${encodeURIComponent(userId)}`),
  assistant: ({ message, scan, userId, scanId }) =>
    request('/api/assistant', {
      method: 'POST',
      body: JSON.stringify({ message, scan, userId, scanId }),
    }),
};
