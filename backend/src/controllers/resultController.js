const firebaseService = require('../services/firebaseService');

const fetchResults = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const results = await firebaseService.getScanResults(userId);
    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { fetchResults };
