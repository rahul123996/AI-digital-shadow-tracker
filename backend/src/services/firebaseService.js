const { db, bucket, isFirebaseLive } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * Firebase service with an in-memory fallback so the demo continues to work
 * when Firestore / Storage credentials are unavailable.
 */

const memory = {
  uploads: new Map(), // fileName -> { buffer, mimetype, size }
  scans: [],          // { id, userId, ... }
  alerts: [],         // { id, userId, ... }
};

function inMemoryUrl(fileName) {
  const base = process.env.PUBLIC_API_BASE || '';
  return `${base}/api/files/${encodeURIComponent(fileName)}`;
}

class FirebaseService {
  isLive() {
    return isFirebaseLive();
  }

  // ---------------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------------
  async uploadFile(file) {
    const fileName = `${uuidv4()}_${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;

    if (!this.isLive()) {
      memory.uploads.set(fileName, {
        buffer: file.buffer,
        mimetype: file.mimetype,
        size: file.size,
      });
      return { fileName, publicUrl: inMemoryUrl(fileName), storage: 'memory' };
    }

    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      metadata: { contentType: file.mimetype },
      resumable: false,
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        // Fall back to memory if Firebase storage write blows up at runtime.
        memory.uploads.set(fileName, {
          buffer: file.buffer,
          mimetype: file.mimetype,
          size: file.size,
        });
        resolve({ fileName, publicUrl: inMemoryUrl(fileName), storage: 'memory', warning: err.message });
      });
      blobStream.on('finish', async () => {
        try {
          await blob.makePublic();
        } catch (_) {
          // Ignore — bucket may not allow public ACLs.
        }
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        resolve({ fileName, publicUrl, storage: 'firebase' });
      });
      blobStream.end(file.buffer);
    });
  }

  getInMemoryFile(fileName) {
    return memory.uploads.get(fileName) || null;
  }

  // ---------------------------------------------------------------------
  // Scans
  // ---------------------------------------------------------------------
  async saveScanResult(userId, data) {
    const record = {
      userId,
      ...data,
      createdAt: new Date().toISOString(),
    };

    if (!this.isLive()) {
      const id = uuidv4();
      memory.scans.unshift({ id, ...record });
      return id;
    }

    try {
      const docRef = db.collection('scans').doc();
      await docRef.set(record);
      return docRef.id;
    } catch (err) {
      console.warn('[firebaseService] scan save fell back to memory:', err.message);
      const id = uuidv4();
      memory.scans.unshift({ id, ...record });
      return id;
    }
  }

  async getScanResults(userId) {
    if (!this.isLive()) {
      return memory.scans.filter((s) => s.userId === userId);
    }
    try {
      const snapshot = await db.collection('scans')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn('[firebaseService] scan fetch fell back to memory:', err.message);
      return memory.scans.filter((s) => s.userId === userId);
    }
  }

  // ---------------------------------------------------------------------
  // Alerts
  // ---------------------------------------------------------------------
  async createAlert(userId, alertData) {
    const record = {
      userId,
      ...alertData,
      status: 'unread',
      createdAt: new Date().toISOString(),
    };

    if (!this.isLive()) {
      const id = uuidv4();
      memory.alerts.unshift({ id, ...record });
      return id;
    }

    try {
      const docRef = db.collection('alerts').doc();
      await docRef.set(record);
      return docRef.id;
    } catch (err) {
      console.warn('[firebaseService] alert save fell back to memory:', err.message);
      const id = uuidv4();
      memory.alerts.unshift({ id, ...record });
      return id;
    }
  }

  async getAlerts(userId) {
    if (!this.isLive()) {
      return memory.alerts.filter((a) => a.userId === userId);
    }
    try {
      const snapshot = await db.collection('alerts')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.warn('[firebaseService] alert fetch fell back to memory:', err.message);
      return memory.alerts.filter((a) => a.userId === userId);
    }
  }
}

module.exports = new FirebaseService();
