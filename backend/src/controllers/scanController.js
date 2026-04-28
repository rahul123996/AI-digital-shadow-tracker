const aiService = require('../services/aiService');
const firebaseService = require('../services/firebaseService');
const fingerprintService = require('../services/fingerprintService');
const { generateSource, listDemoCases } = require('../services/sourceSimulator');
const recommendationService = require('../services/recommendationService');

// Build a minimal "known sources" hint from the pre-record snapshot, so we can
// forward it to the AI engine before the new external source is generated.
function knownSourcesHint(existing) {
  if (!existing) return [];
  const out = [];
  for (const dom of (existing.external_sources || []).slice(0, 2)) {
    out.push({ kind: 'external', label: dom });
  }
  for (const u of (existing.history || []).slice(-2)) {
    out.push({ kind: 'internal', label: u.user_label || u.user_id || 'user' });
  }
  return out.slice(0, 3);
}

function buildSources(snapshot, externalSource) {
  const sources = [];
  if (externalSource?.source_domain) {
    sources.push({
      kind: 'external',
      label: externalSource.source_domain,
      detail: externalSource.source_category || 'Simulated external match',
      url: externalSource.source_url,
      confidence_score: externalSource.confidence_score,
    });
  }
  if (snapshot?.previous_uploaders?.length) {
    for (const u of snapshot.previous_uploaders) {
      sources.push({
        kind: 'internal',
        label: u.user_label || u.user_id,
        detail: `Internal upload (${u.event || 'scan'})`,
        timestamp: u.timestamp,
        confidence_score: 100,
      });
    }
  }
  return sources;
}

function attachAdjustedRisk(scan, duplication) {
  if (!duplication) return scan;
  // Boost risk when content has been seen multiple times — especially across
  // different users / sources.
  const boost = Math.round(duplication * 18);
  const newRiskScore = Math.min(100, (scan.risk_score || 0) + boost);
  let newLevel = scan.risk_level;
  if (newRiskScore >= 80) newLevel = 'High Risk';
  else if (newRiskScore >= 50) newLevel = 'Suspicious';
  return {
    ...scan,
    risk_score: newRiskScore,
    risk_level: newLevel,
    duplication_factor: duplication,
    duplication_boost: boost,
  };
}

async function persistAndAlert({ userId, payload, scan, snapshot, externalSource }) {
  const sources_found = buildSources(snapshot, externalSource);
  const partialScan = {
    ...payload,
    ...scan,
    ...externalSource,
    fingerprint: snapshot.fingerprint,
    is_duplicate: snapshot.is_duplicate,
    duplicate_info: snapshot,
    sources_found,
  };
  const recommendations = recommendationService.build(partialScan);
  const finalScan = { ...partialScan, recommendations };

  const id = await firebaseService.saveScanResult(userId, finalScan);

  if (finalScan.risk_level === 'High Risk') {
    await firebaseService.createAlert(userId, {
      type: snapshot.is_duplicate ? 'High Risk Detection (repeat)' : 'High Risk Detection',
      message: finalScan.explanation || 'High-risk match detected.',
      scanId: id,
      source_url: finalScan.source_url,
      fingerprint: snapshot.fingerprint,
    });
  }

  return { id, data: { id, ...finalScan } };
}

const triggerScan = async (req, res) => {
  const { imageUrl, userId, userLabel, context, fileName, fingerprint: incomingFp } = req.body;
  if (!imageUrl || !userId) {
    return res.status(400).json({ error: 'imageUrl and userId are required' });
  }

  try {
    // The fingerprint is computed at upload time and forwarded here.
    let fingerprint = incomingFp;
    if (!fingerprint) {
      // Defensive fallback: derive a stable id from the public URL.
      fingerprint = fingerprintService.fingerprintText(imageUrl);
    }
    const existing = fingerprintService.lookup(fingerprint);
    const duplicationFactor = fingerprintService.duplicationFactor(existing);
    const sourcesHint = knownSourcesHint(existing);

    const raw = await aiService.analyzeImage(imageUrl, context || '', duplicationFactor, sourcesHint);
    const externalSource = generateSource(raw.risk_level, raw.similarity_score);
    const adjusted = attachAdjustedRisk(raw, duplicationFactor);

    const snapshot = fingerprintService.record({
      fingerprint,
      type: 'image',
      userId,
      userLabel,
      event: 'scan',
      summary: fileName || imageUrl,
      sourceUrl: externalSource.source_url,
      sourceDomain: externalSource.source_domain,
      sourceCategory: externalSource.source_category,
    });

    const out = await persistAndAlert({
      userId,
      payload: { type: 'image', imageUrl, fileName, context: context || '' },
      scan: adjusted,
      snapshot,
      externalSource,
    });
    res.status(200).json({ success: true, ...out });
  } catch (error) {
    console.error('Scan error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const scanText = async (req, res) => {
  const { text, userId, userLabel, context } = req.body;
  if (!text || !userId) {
    return res.status(400).json({ error: 'text and userId are required' });
  }

  try {
    const fingerprint = fingerprintService.fingerprintText(text);
    const existing = fingerprintService.lookup(fingerprint);
    const duplicationFactor = fingerprintService.duplicationFactor(existing);
    const sourcesHint = knownSourcesHint(existing);

    const raw = await aiService.analyzeText(text, context || '', duplicationFactor, sourcesHint);
    const externalSource = generateSource(raw.risk_level, raw.similarity_score);
    const adjusted = attachAdjustedRisk(raw, duplicationFactor);

    const snapshot = fingerprintService.record({
      fingerprint,
      type: 'text',
      userId,
      userLabel,
      event: 'scan',
      summary: text.slice(0, 80),
      sourceUrl: externalSource.source_url,
      sourceDomain: externalSource.source_domain,
      sourceCategory: externalSource.source_category,
    });

    const out = await persistAndAlert({
      userId,
      payload: { type: 'text', text, context: context || '' },
      scan: adjusted,
      snapshot,
      externalSource,
    });
    res.status(200).json({ success: true, ...out });
  } catch (error) {
    console.error('Text scan error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const previewScan = async (req, res) => {
  const { text, fileName, context, type } = req.body;
  const subject = type === 'image' ? (fileName || 'image') : (text || '');
  if (!subject) {
    return res.status(400).json({ error: 'text or fileName is required' });
  }

  try {
    const blob = `${subject} ${context || ''}`.toLowerCase();
    const flags = ['scam', 'fraud', 'leak', 'breach', 'phishing', 'fake', 'impersonat', 'dump', 'password'];
    const hits = flags.filter((f) => blob.includes(f)).length;
    let probability = 25 + hits * 18;
    if (type === 'image' && /scam|fake|profile|leak/i.test(subject)) probability += 10;

    // Bump the predicted risk if we've already seen this exact content.
    let duplicate_info = null;
    if (type === 'text') {
      const fp = fingerprintService.fingerprintText(text);
      const existing = fingerprintService.lookup(fp);
      if (existing) {
        probability += Math.min(25, existing.occurrence_count * 8);
        duplicate_info = existing;
      }
    }
    probability = Math.max(8, Math.min(96, probability + Math.round(Math.random() * 6 - 3)));
    const level = probability >= 80 ? 'High Risk' : probability >= 50 ? 'Suspicious' : 'Safe';
    res.json({
      success: true,
      data: {
        predicted_risk: probability,
        predicted_level: level,
        message: `This content has a ${probability}% chance of misuse.`,
        duplicate_info,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const liveScan = async (req, res) => {
  const { userId, userLabel } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const demos = listDemoCases();
    const synthetic = [
      { type: 'text', text: 'rahul.test@example.com',
        context: 'Email address found in a plain-text breach dump on a known leak site.' },
      { type: 'text', text: 'Verified portfolio manager at SecureCryptoVault',
        context: 'Profile bio reused on a high-yield investment scam landing page.' },
      { type: 'text', text: 'Senior engineer resume PDF',
        context: 'Resume re-listed on an unverified HR portal flagged for phishing.' },
      { type: 'text', text: 'Family vacation photo',
        context: 'Image surfaced on a verified social network with original caption.' },
    ];
    const pool = demos.length > 0
      ? demos.map((d) => ({ type: 'text', text: d.found_content || d.source_content, context: d.context }))
      : synthetic;
    const sample = pool[Math.floor(Math.random() * pool.length)];

    const fingerprint = fingerprintService.fingerprintText(sample.text);
    const existing = fingerprintService.lookup(fingerprint);
    const duplicationFactor = fingerprintService.duplicationFactor(existing);
    const sourcesHint = knownSourcesHint(existing);

    const raw = await aiService.analyzeText(sample.text, sample.context, duplicationFactor, sourcesHint);
    const externalSource = generateSource(raw.risk_level, raw.similarity_score);
    const adjusted = attachAdjustedRisk(raw, duplicationFactor);

    const snapshot = fingerprintService.record({
      fingerprint,
      type: 'text',
      userId,
      userLabel,
      event: 'live',
      summary: sample.text.slice(0, 80),
      sourceUrl: externalSource.source_url,
      sourceDomain: externalSource.source_domain,
      sourceCategory: externalSource.source_category,
    });

    const out = await persistAndAlert({
      userId,
      payload: { type: sample.type, text: sample.text, context: sample.context, live: true },
      scan: adjusted,
      snapshot,
      externalSource,
    });
    out.data.live = true;
    res.json({ success: true, ...out });
  } catch (err) {
    console.error('Live scan error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { triggerScan, scanText, previewScan, liveScan };
