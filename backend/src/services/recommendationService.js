/**
 * Generates a small "Suggested Action" payload for a scan.
 * Pure function — works without any external dependency, but the result
 * is shaped so it can later be replaced by an LLM-generated version.
 */

function build(scan) {
  if (!scan) return null;
  const level = scan.risk_level || 'Safe';
  const score = scan.risk_score || 0;
  const dup = scan.duplicate_info || {};
  const isDup = !!scan.is_duplicate;
  const sourcesCount = (scan.sources_found || []).length;
  const types = scan.detected_misuse_types || [];

  let primary = 'monitor';
  let label = 'Monitor';
  let summary = 'Keep an eye on this match — no action needed yet.';
  let urgency = 'low';
  const steps = [];

  if (level === 'High Risk' || score >= 80) {
    primary = 'report';
    label = 'Report & Takedown';
    urgency = 'critical';
    summary = isDup
      ? `Duplicate misuse confirmed across ${dup.unique_users || 1} users — file a takedown immediately.`
      : 'Strong signs of misuse — submit a takedown request to the hosting platform.';
    steps.push('File a takedown / report-abuse request with the source platform.');
    if (sourcesCount > 0) steps.push('Capture screenshots of every detected source for evidence.');
    if (types.includes('Phishing / Scam')) steps.push('Warn anyone in the affected audience about the scam.');
    if (types.includes('Data Leak')) steps.push('Rotate any leaked credentials or sensitive details right away.');
    if (types.includes('Impersonation')) steps.push('Open an impersonation report on the host platform.');
  } else if (level === 'Suspicious' || score >= 50) {
    primary = 'investigate';
    label = 'Investigate';
    urgency = 'medium';
    summary = 'Signals are mixed — gather more context before acting.';
    steps.push('Open the source URL and verify whether the listing is legitimate.');
    steps.push('Bookmark the page and re-scan after 24h to see if the score escalates.');
    if (isDup) steps.push('Cross-check the previous uploaders to see whether one of them is the original owner.');
  } else {
    primary = 'monitor';
    label = 'Monitor';
    urgency = 'low';
    summary = 'No reliable indicators of misuse — keep this match in the watchlist.';
    steps.push('Add this fingerprint to live monitoring so you’re alerted on any new sighting.');
  }

  if (isDup && primary !== 'report') {
    steps.push('Repeated usage detected — increase monitoring frequency for this fingerprint.');
  }

  return {
    primary,
    label,
    summary,
    urgency,
    steps: steps.slice(0, 4),
    options: [
      { id: 'report', label: 'Report' },
      { id: 'monitor', label: 'Monitor' },
      { id: 'ignore', label: 'Ignore' },
    ],
  };
}

module.exports = { build };
