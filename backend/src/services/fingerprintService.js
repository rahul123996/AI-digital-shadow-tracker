/**
 * Fingerprint registry — gives every uploaded image / text a stable hash so we
 * can detect re-uploads, map them to multiple users, and build a timeline of
 * how a piece of content has been re-shared across the system.
 *
 * Backed by an in-memory Map (matches the Firebase fallback used elsewhere).
 */

const crypto = require('crypto');

const registry = new Map(); // fingerprint -> record

function _normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function fingerprintBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function fingerprintText(text) {
  return crypto.createHash('sha256').update(_normalizeText(text)).digest('hex');
}

function _ensure(fingerprint, type, summary) {
  if (!registry.has(fingerprint)) {
    registry.set(fingerprint, {
      fingerprint,
      type,
      content_summary: summary,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      history: [],
      unique_user_ids: [],
      external_sources: [],
    });
  }
  return registry.get(fingerprint);
}

/**
 * Record a sighting of a piece of content (an upload, a scan or a live hit).
 *
 * @param {object} entry
 * @param {string} entry.fingerprint
 * @param {'image'|'text'} entry.type
 * @param {string} entry.userId
 * @param {string} [entry.userLabel]
 * @param {string} [entry.scanId]
 * @param {string} [entry.summary]   // short human-readable preview
 * @param {string} [entry.event]     // 'upload' | 'scan' | 'live'
 * @param {string} [entry.sourceUrl]
 * @param {string} [entry.sourceDomain]
 * @param {string} [entry.sourceCategory]
 * @returns {object} record snapshot (with computed duplicate stats)
 */
function record(entry) {
  const now = new Date().toISOString();
  const rec = _ensure(entry.fingerprint, entry.type, entry.summary);
  rec.last_seen = now;
  if (!rec.content_summary && entry.summary) rec.content_summary = entry.summary;

  rec.history.push({
    user_id: entry.userId,
    user_label: entry.userLabel || entry.userId,
    scan_id: entry.scanId || null,
    event: entry.event || 'scan',
    source_url: entry.sourceUrl || null,
    source_domain: entry.sourceDomain || null,
    source_category: entry.sourceCategory || null,
    timestamp: now,
  });

  if (entry.userId && !rec.unique_user_ids.includes(entry.userId)) {
    rec.unique_user_ids.push(entry.userId);
  }
  if (entry.sourceDomain && !rec.external_sources.includes(entry.sourceDomain)) {
    rec.external_sources.push(entry.sourceDomain);
  }

  return summarize(rec);
}

/**
 * Look at a fingerprint without recording a new sighting.
 */
function lookup(fingerprint) {
  const rec = registry.get(fingerprint);
  return rec ? summarize(rec) : null;
}

/**
 * Summarises the record into the shape the API surfaces to clients.
 */
function summarize(rec) {
  const occurrence_count = rec.history.length;
  const unique_users = rec.unique_user_ids.length;
  const previous_uploaders = rec.history
    .slice(0, Math.max(0, occurrence_count - 1))
    .map((h) => ({
      user_id: h.user_id,
      user_label: h.user_label,
      timestamp: h.timestamp,
      event: h.event,
      source_domain: h.source_domain,
    }));
  // De-dup by user, keep earliest timestamp per user.
  const dedupMap = new Map();
  for (const p of previous_uploaders) {
    if (!dedupMap.has(p.user_id)) dedupMap.set(p.user_id, p);
  }
  return {
    fingerprint: rec.fingerprint,
    type: rec.type,
    first_seen: rec.first_seen,
    last_seen: rec.last_seen,
    occurrence_count,
    unique_users,
    is_duplicate: occurrence_count > 1,
    timeline: rec.history.map((h) => ({ ...h })),
    previous_uploaders: Array.from(dedupMap.values()),
    external_sources: [...rec.external_sources],
    content_summary: rec.content_summary || '',
  };
}

/**
 * Compute a duplication factor (0..1) used to boost the risk score.
 * Repeated uploads across multiple users are weighted higher.
 */
function duplicationFactor(snapshot) {
  if (!snapshot || snapshot.occurrence_count < 1) return 0;
  // Treat any prior sighting as a duplication signal — the snapshot passed
  // here represents the state *before* the current scan was recorded.
  const priorSightings = snapshot.occurrence_count;
  const userSpread = snapshot.unique_users;
  const sourceSpread = snapshot.external_sources.length;
  const raw = priorSightings * 0.15 + userSpread * 0.2 + sourceSpread * 0.1;
  return Math.min(1, Number(raw.toFixed(2)));
}

module.exports = {
  fingerprintBuffer,
  fingerprintText,
  record,
  lookup,
  duplicationFactor,
};
