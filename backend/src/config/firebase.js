const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let db;
let bucket;
let firebaseLive = false;

const credentialsPath = path.join(__dirname, '../../serviceAccountKey.json');

function looksLikeRealKey(key) {
  return (
    key &&
    typeof key.private_key === 'string' &&
    key.private_key.includes('BEGIN PRIVATE KEY') &&
    key.private_key.length > 200
  );
}

try {
  if (!fs.existsSync(credentialsPath)) {
    throw new Error('serviceAccountKey.json not found');
  }

  const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  if (!looksLikeRealKey(serviceAccount)) {
    throw new Error('Service account key is a placeholder');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: serviceAccount.project_id
      ? `${serviceAccount.project_id}.appspot.com`
      : undefined,
  });

  db = admin.firestore();
  bucket = admin.storage().bucket();
  firebaseLive = true;
  console.log('✅ Firebase initialised');
} catch (error) {
  console.warn(
    '⚠️  Firebase not active — running in in-memory demo mode. Reason:',
    error.message,
  );
  db = null;
  bucket = null;
  firebaseLive = false;
}

module.exports = {
  admin,
  db,
  bucket,
  isFirebaseLive: () => firebaseLive,
};
