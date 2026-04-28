/**
 * Lightweight AI assistant. Uses Gemini when GEMINI_API_KEY is set,
 * otherwise falls back to a deterministic answer derived from the
 * provided scan context.
 */

let genAi = null;
let model = null;
try {
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAi.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('[assistantService] ✅ Gemini model ready');
  }
} catch (err) {
  console.warn('[assistantService] Gemini SDK not available:', err.message);
  model = null;
}

function _scanSummary(scan) {
  if (!scan) return '';
  const parts = [
    `risk_level=${scan.risk_level}`,
    `risk_score=${scan.risk_score}`,
    `similarity=${Math.round((scan.similarity_score || 0) * 100)}%`,
  ];
  if (scan.is_duplicate) parts.push(`duplicate=true (seen ${scan.duplicate_info?.occurrence_count || 1}x across ${scan.duplicate_info?.unique_users || 1} users)`);
  if (Array.isArray(scan.detected_misuse_types) && scan.detected_misuse_types.length) {
    parts.push(`misuse_types=[${scan.detected_misuse_types.join(', ')}]`);
  }
  if (scan.source_domain) parts.push(`source=${scan.source_domain}`);
  return parts.join('; ');
}

function _fallback(message, scan) {
  const m = (message || '').toLowerCase();
  const summary = _scanSummary(scan);
  if (!message) {
    return {
      reply: 'Ask me anything about your scan — for example: "Is this safe?", "Why was it flagged?", or "What should I do next?".',
      source: 'fallback',
    };
  }
  if (/safe|risk|danger/.test(m)) {
    if (scan?.risk_level === 'High Risk') {
      return { reply: `This match is marked **High Risk** (${scan.risk_score}/100). I would treat it as misuse — file a takedown and capture evidence right away.`, source: 'fallback' };
    }
    if (scan?.risk_level === 'Suspicious') {
      return { reply: `It's **Suspicious** (${scan.risk_score}/100). The signals are mixed — I'd open the source, verify the context, and re-check in 24h.`, source: 'fallback' };
    }
    return { reply: 'Looks **Safe** based on the latest analysis — no strong indicators of misuse were found. Keep monitoring just in case.', source: 'fallback' };
  }
  if (/why|explain|reason|flagged/.test(m)) {
    const bullets = scan?.why_flagged?.slice(0, 3).map((b) => `• ${b}`).join('\n');
    if (bullets) return { reply: `Here's what tipped the verdict:\n${bullets}`, source: 'fallback' };
  }
  if (/(do|action|next|takedown|report)/.test(m)) {
    if (scan?.recommendations?.steps?.length) {
      return { reply: `Recommended action: **${scan.recommendations.label}**\n${scan.recommendations.steps.map((s) => `• ${s}`).join('\n')}`, source: 'fallback' };
    }
  }
  if (/duplicate|same|other users/.test(m) && scan?.is_duplicate) {
    const d = scan.duplicate_info || {};
    return { reply: `Yes — the same content has surfaced **${d.occurrence_count || 1} times** across **${d.unique_users || 1} users** so far. Repeated usage usually indicates organised misuse.`, source: 'fallback' };
  }
  return {
    reply: `I'm running in offline mode (no Gemini key). Here's what I know about this scan: ${summary || 'no scan selected.'}\nTry asking: "Is this safe?", "Why was it flagged?", or "What should I do?".`,
    source: 'fallback',
  };
}

async function chat({ message, scan }) {
  if (!model) return _fallback(message, scan);

  const trimmedMsg = String(message || '').slice(0, 500);
  const summary = _scanSummary(scan);
  const prompt = [
    'You are an AI security analyst inside the "AI Digital Shadow Tracker" app.',
    'Answer the user briefly (max 4 sentences) using the scan context below.',
    'Be specific, calm, and actionable. Use plain language.',
    '',
    `Scan context: ${summary || 'no scan selected'}`,
    `Last AI explanation: ${(scan?.explanation || '').slice(0, 300)}`,
    '',
    `User question: ${trimmedMsg}`,
  ].join('\n');

  try {
    const result = await model.generateContent(prompt);
    const text = (result?.response?.text?.() || '').trim();
    if (!text) return _fallback(message, scan);
    return { reply: text, source: 'gemini' };
  } catch (err) {
    console.warn('[assistantService] Gemini call failed:', err.message);
    return _fallback(message, scan);
  }
}

module.exports = { chat };
