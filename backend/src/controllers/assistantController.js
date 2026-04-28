const assistantService = require('../services/assistantService');
const firebaseService = require('../services/firebaseService');

const chat = async (req, res) => {
  const { message, userId, scanId, scan } = req.body || {};
  try {
    let scanCtx = scan || null;
    if (!scanCtx && userId && scanId) {
      const all = await firebaseService.getScanResults(userId);
      scanCtx = (all || []).find((s) => s.id === scanId) || null;
    }
    const response = await assistantService.chat({ message, scan: scanCtx });
    res.json({ success: true, data: response });
  } catch (err) {
    console.error('[assistantController] error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { chat };
