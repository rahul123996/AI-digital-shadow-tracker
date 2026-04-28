/**
 * Generates plausible "discovered on" metadata for a scan so the dashboard
 * can show where in the simulated internet the content was spotted.
 */

const path = require('path');
const fs = require('fs');

let demoData = { fake_websites: [] };
try {
  const datasetPath = path.join(__dirname, '../../../datasets/demo_data.json');
  demoData = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
} catch (err) {
  console.warn('[sourceSimulator] demo dataset not loaded:', err.message);
}

const GENERIC_DOMAINS = {
  'High Risk': [
    { domain: 'pastebin.shadow-net.org', category: 'Data Leak Repository' },
    { domain: 'secure-crypto-vault-2026.com', category: 'Investment Scam' },
    { domain: 'darkmirror-leaks.io', category: 'Dark Web Mirror' },
    { domain: 'identity-theft-forum.cc', category: 'Identity Fraud Forum' },
  ],
  Suspicious: [
    { domain: 'random-hr-portal.xyz', category: 'Suspicious Job Board' },
    { domain: 'unverified-news.today', category: 'Low Reputation Site' },
    { domain: 'social-clone-vault.net', category: 'Profile Aggregator' },
    { domain: 'free-prize-claim.online', category: 'Engagement Bait' },
  ],
  Safe: [
    { domain: 'linkedin.com', category: 'Verified Network' },
    { domain: 'github.com', category: 'Code Repository' },
    { domain: 'medium.com', category: 'Editorial Platform' },
    { domain: 'replit.com', category: 'Developer Community' },
  ],
};

function pickFrom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function urlPath(level) {
  if (level === 'High Risk') return ['/leak/db_dump_192', '/team', '/dump/2026-04', '/users/exposed'][Math.floor(Math.random() * 4)];
  if (level === 'Suspicious') return ['/profiles/match', '/listings/job-12', '/mirror/u/8721'][Math.floor(Math.random() * 3)];
  return ['/in/profile', '/users/you', '/posts/12'][Math.floor(Math.random() * 3)];
}

/**
 * @param {string} riskLevel - "Safe" | "Suspicious" | "High Risk"
 * @param {number} similarityScore - 0..1
 */
function generateSource(riskLevel, similarityScore = 0) {
  // Prefer real entries from demo dataset for High Risk so the demo feels
  // grounded; fall back to the generic pool otherwise.
  let entry = null;
  if (riskLevel === 'High Risk' && demoData.fake_websites?.length) {
    entry = pickFrom(demoData.fake_websites);
  }
  if (!entry) entry = pickFrom(GENERIC_DOMAINS[riskLevel] || GENERIC_DOMAINS.Safe);

  const url = `https://${entry.domain}${urlPath(riskLevel)}`;
  const confidence = Math.round(
    Math.max(40, Math.min(99, (entry.risk_score || (similarityScore * 100)) + (Math.random() * 8 - 4))),
  );
  return {
    source_url: url,
    source_domain: entry.domain,
    source_category: entry.category,
    source_risk_score: entry.risk_score || null,
    confidence_score: confidence,
  };
}

function listDemoCases() {
  return demoData.test_cases || [];
}

module.exports = { generateSource, listDemoCases };
