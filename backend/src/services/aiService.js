const axios = require('axios');

class AIService {
  constructor() {
    this.baseUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
  }

  // Keep payloads small and predictable: trim long content / cap source list.
  _shape(content, context, sourcesFound) {
    const trim = (s, n) => (typeof s === 'string' && s.length > n ? `${s.slice(0, n - 1)}…` : s || '');
    const sources = Array.isArray(sourcesFound) ? sourcesFound.slice(0, 3) : undefined;
    return { content: trim(content, 500), context: trim(context, 500), sources };
  }

  _fallback(content, context, kind, duplicationFactor = 0, sourcesFound = []) {
    const blob = `${content} ${context || ''}`.toLowerCase();
    const flags = ['scam', 'fraud', 'leak', 'breach', 'phishing', 'fake', 'impersonat'];
    let risk = flags.some((f) => blob.includes(f)) ? 70 : 30;
    if (duplicationFactor > 0.7) risk += 40;
    else if (duplicationFactor > 0.4) risk += 25;
    else if (duplicationFactor > 0) risk += Math.round(duplicationFactor * 18);
    if (Array.isArray(sourcesFound) && sourcesFound.length > 2) risk += 20;
    risk = Math.max(0, Math.min(100, risk));
    const level = risk > 70 ? 'High Risk' : risk > 40 ? 'Suspicious' : 'Safe';
    const reason = `AI engine offline — calculated using fallback logic with duplication analysis.`;
    return {
      similarity_score: Math.min(1, risk / 100),
      risk_score: risk,
      risk_level: level,
      misuse_detected: level === 'High Risk',
      explanation: reason,
      reason,
      detected_misuse_types: [],
      why_flagged: ['AI engine unreachable — score derived from keyword, duplication, and source signals.'],
      duplication_factor: duplicationFactor,
      source: 'fallback-backend',
    };
  }

  async _post(payload, kind, content, context, duplicationFactor, sourcesFound) {
    try {
      const { data } = await axios.post(`${this.baseUrl}/analyze`, payload, { timeout: 25000 });
      if (!data || typeof data !== 'object') {
        console.warn(`[aiService] ${kind} analyze returned non-object — using fallback`);
        return this._fallback(content, context, kind, duplicationFactor, sourcesFound);
      }
      return data;
    } catch (error) {
      console.warn(`[aiService] ${kind} analyze failed:`, error.message);
      return this._fallback(content, context, kind, duplicationFactor, sourcesFound);
    }
  }

  async analyzeImage(imageUrl, context = '', duplicationFactor = 0, sourcesFound = []) {
    const shaped = this._shape(imageUrl, context, sourcesFound);
    return this._post(
      {
        type: 'image',
        content: shaped.content,
        context: shaped.context,
        duplication_factor: duplicationFactor,
        sources_found: shaped.sources,
      },
      'image', imageUrl, context, duplicationFactor, sourcesFound,
    );
  }

  async analyzeText(text, context = '', duplicationFactor = 0, sourcesFound = []) {
    const shaped = this._shape(text, context, sourcesFound);
    return this._post(
      {
        type: 'text',
        content: shaped.content,
        context: shaped.context,
        duplication_factor: duplicationFactor,
        sources_found: shaped.sources,
      },
      'text', text, context, duplicationFactor, sourcesFound,
    );
  }

  // Legacy alias kept for backwards compatibility.
  async triggerScan(imageUrl, userId, context = '') {
    return this.analyzeImage(imageUrl, context);
  }
}

module.exports = new AIService();
