const firebaseService = require('../services/firebaseService');

const sendAlert = async (req, res) => {
  const { userId, type, message } = req.body;

  if (!userId || !type || !message) {
    return res.status(400).json({ error: 'userId, type, and message are required' });
  }

  try {
    const alertId = await firebaseService.createAlert(userId, { type, message });
    res.status(201).json({ success: true, message: 'Alert created', alertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listAlerts = async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const alerts = await firebaseService.getAlerts(userId);
    res.status(200).json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { sendAlert, listAlerts };
