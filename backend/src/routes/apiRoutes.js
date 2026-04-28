const express = require('express');
const router = express.Router();

const { uploadContent, getFile } = require('../controllers/uploadController');
const { triggerScan, scanText, previewScan, liveScan } = require('../controllers/scanController');
const { fetchResults } = require('../controllers/resultController');
const { sendAlert, listAlerts } = require('../controllers/alertController');
const { getIdentityScore } = require('../controllers/identityController');
const { chat: assistantChat } = require('../controllers/assistantController');
const { isFirebaseLive } = require('../config/firebase');

const upload = require('../middleware/uploadMiddleware');

router.get('/status', (req, res) => {
  res.json({
    status: 'UP',
    firebase: isFirebaseLive() ? 'live' : 'memory-fallback',
    aiEngine: process.env.AI_ENGINE_URL || 'http://localhost:8000',
  });
});

router.post('/upload', upload.single('file'), uploadContent);
router.post('/scan', triggerScan);
router.post('/scan/text', scanText);
router.post('/scan/preview', previewScan);
router.post('/scan/live', liveScan);
router.get('/results', fetchResults);
router.post('/alert', sendAlert);
router.get('/alerts', listAlerts);
router.get('/files/:fileName', getFile);
router.get('/identity-score', getIdentityScore);
router.post('/assistant', assistantChat);

module.exports = router;
