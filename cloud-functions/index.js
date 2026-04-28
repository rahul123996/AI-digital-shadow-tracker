const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

const AI_ENGINE_URL = functions.config().ai_engine.url || 'http://localhost:8000';

/**
 * Triggered when a new file is uploaded to Firebase Storage.
 */
exports.onUploadTrigger = functions.storage.object().onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;

    if (!contentType.startsWith('image/')) {
        console.log('This is not an image.');
        return null;
    }

    console.log(`File ${filePath} uploaded. Triggering AI Scan...`);
    
    // In a real setup, we extract userId from metadata or path
    const userId = object.metadata ? object.metadata.userId : 'system_user';
    const imageUrl = `https://storage.googleapis.com/${object.bucket}/${filePath}`;

    return runAIScan(imageUrl, userId);
});

/**
 * Communicates with the AI Engine to process the scan.
 */
async function runAIScan(imageUrl, userId) {
    try {
        const response = await axios.post(`${AI_ENGINE_URL}/analyze/image`, {
            original_image_path: imageUrl,
            found_image_path: imageUrl, // For demo purposes
            context: "Automated background scan triggered by upload."
        });

        const scanData = {
            userId,
            imageUrl,
            ...response.data,
            status: 'completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Save results to Firestore
        await admin.firestore().collection('scans').add(scanData);
        console.log('Scan results saved successfully.');
        
        return { success: true };
    } catch (error) {
        console.error('AI Scan Error:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Triggered when a new scan result is added to Firestore.
 * If risk is 'High Risk', it sends an alert.
 */
exports.onScanResultCreated = functions.firestore
    .document('scans/{scanId}')
    .onCreate(async (snapshot, context) => {
        const scanData = snapshot.data();

        if (scanData.risk_level === 'High Risk' || scanData.risk_score > 75) {
            return sendAlert(scanData.userId, scanData);
        }

        return null;
    });

/**
 * Sends an alert notification to the user.
 */
async function sendAlert(userId, scanData) {
    console.log(`HIGH RISK DETECTED for user ${userId}. Sending alert...`);

    const alertData = {
        userId,
        type: 'CRITICAL_LEAK',
        title: 'High Risk Detected!',
        message: `A high-risk digital shadow match was found. Risk Score: ${scanData.risk_score}. Analysis: ${scanData.explanation}`,
        scanId: scanData.id || '',
        status: 'unread',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save alert to Firestore (which would then be picked up by the mobile app)
    await admin.firestore().collection('alerts').add(alertData);

    // If using FCM (Firebase Cloud Messaging):
    // const message = {
    //     notification: { title: alertData.title, body: alertData.message },
    //     topic: userId
    // };
    // await admin.messaging().send(message);

    return { alertSent: true };
}
