const admin = require('firebase-admin');
const zlib = require('zlib'); // This is a built-in Node.js library

// This is the standard code to handle a compressed, Base64-encoded service account
try {
    const base64 = process.env.FIREBASE_CREDENTIALS_BASE64;
    const decoded = Buffer.from(base64, 'base64');
    const decompressed = zlib.gunzipSync(decoded);
    const serviceAccount = JSON.parse(decompressed.toString());

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
} catch (error) {
    console.error("Firebase initialization failed!", error);
}

// ... the rest of your handler code follows
exports.handler = async (event, context) => {
    // ...
};