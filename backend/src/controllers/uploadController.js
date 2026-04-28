const firebaseService = require('../services/firebaseService');
const fingerprintService = require('../services/fingerprintService');

const uploadContent = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const upload = await firebaseService.uploadFile(req.file);
    const userId = req.body.userId || 'demo-user';
    const userLabel = req.body.userLabel || userId;

    // Fingerprint the raw bytes so we can spot re-uploads even when the file
    // name is different.
    const fingerprint = fingerprintService.fingerprintBuffer(req.file.buffer);
    const existing = fingerprintService.lookup(fingerprint);
    const snapshot = fingerprintService.record({
      fingerprint,
      type: 'image',
      userId,
      userLabel,
      event: 'upload',
      summary: req.file.originalname,
    });

    res.status(201).json({
      success: true,
      message: 'Content uploaded successfully',
      data: {
        publicUrl: upload.publicUrl,
        fileName: upload.fileName,
        storage: upload.storage,
        userId,
        fingerprint,
        is_duplicate: !!existing && existing.occurrence_count >= 1,
        duplicate_info: snapshot,
      },
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const getFile = (req, res) => {
  const file = firebaseService.getInMemoryFile(req.params.fileName);
  if (!file) return res.status(404).json({ error: 'File not found' });
  res.set('Content-Type', file.mimetype || 'application/octet-stream');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(file.buffer);
};

module.exports = { uploadContent, getFile };
