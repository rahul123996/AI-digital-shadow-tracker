/**
 * Computes a "Digital Safety Score" (0-100) for a user from their scan
 * history. Higher = safer. Pure deterministic function so the same
 * history always yields the same score.
 */

const LEVEL_PENALTY = { 'High Risk': 14, Suspicious: 6, Safe: 0 };

function compute(scans = []) {
  if (!Array.isArray(scans) || scans.length === 0) {
    return {
      score: 100,
      grade: 'A',
      label: 'Pristine',
      summary: 'No scans yet — you start with a clean slate.',
      breakdown: { high: 0, suspicious: 0, safe: 0, duplicates: 0, total: 0 },
      trend: 'flat',
    };
  }

  let score = 100;
  let high = 0;
  let suspicious = 0;
  let safe = 0;
  let duplicates = 0;

  for (const s of scans) {
    const level = s.risk_level || 'Safe';
    score -= LEVEL_PENALTY[level] ?? 0;
    if (s.is_duplicate) {
      duplicates += 1;
      score -= 4;
    }
    if (level === 'High Risk') high += 1;
    else if (level === 'Suspicious') suspicious += 1;
    else safe += 1;
  }

  // Reward for having a healthy ratio of safe scans (caps the floor).
  if (safe > 0 && high === 0 && suspicious === 0) score = Math.min(100, score + 5);
  score = Math.max(0, Math.min(100, Math.round(score)));

  let grade = 'A';
  let label = 'Pristine';
  if (score < 30) { grade = 'F'; label = 'Critical'; }
  else if (score < 50) { grade = 'D'; label = 'At Risk'; }
  else if (score < 70) { grade = 'C'; label = 'Caution'; }
  else if (score < 85) { grade = 'B'; label = 'Healthy'; }

  // Trend = compare last 3 scans to previous 3.
  const sorted = [...scans].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const recent = sorted.slice(0, 3);
  const previous = sorted.slice(3, 6);
  const trendScore = (arr) => arr.reduce((acc, s) => acc + (LEVEL_PENALTY[s.risk_level] || 0), 0) / Math.max(1, arr.length);
  let trend = 'flat';
  if (previous.length > 0) {
    const diff = trendScore(recent) - trendScore(previous);
    if (diff > 1.5) trend = 'down';
    else if (diff < -1.5) trend = 'up';
  }

  const summary = high > 0
    ? `${high} high-risk match${high === 1 ? '' : 'es'} detected — your exposure score is ${label.toLowerCase()}.`
    : suspicious > 0
      ? `${suspicious} suspicious item${suspicious === 1 ? '' : 's'} on file — keep monitoring.`
      : 'No risky matches in your history — you’re looking great.';

  return {
    score,
    grade,
    label,
    summary,
    breakdown: { high, suspicious, safe, duplicates, total: scans.length },
    trend,
  };
}

module.exports = { compute };
