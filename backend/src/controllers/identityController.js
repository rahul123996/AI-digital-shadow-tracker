const firebaseService = require('../services/firebaseService');
const identityScoreService = require('../services/identityScoreService');

const getIdentityScore = async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  try {
    const scans = await firebaseService.getScanResults(userId);
    const score = identityScoreService.compute(scans || []);
    res.json({ success: true, data: score });
  } catch (err) {
    console.error('[identityController] error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getIdentityScore };
