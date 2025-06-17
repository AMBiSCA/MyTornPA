// netlify/functions/setAdminClaim.js

const admin = require('firebase-admin'); // Firebase Admin SDK

// IMPORTANT: Initialize Firebase Admin SDK
// We'll parse the service account key from environment variables.
// Make sure FIREBASE_ADMIN_SDK_CONFIG env var is set on Netlify.
try {
  // --- MODIFICATION HERE: Decode from Base64 ---
  const encodedServiceAccount = process.env.FIREBASE_ADMIN_SDK_CONFIG;
  const decodedServiceAccount = Buffer.from(encodedServiceAccount, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(decodedServiceAccount);
  // --- END MODIFICATION ---

  // Initialize only if not already initialized (Netlify might warm up functions)
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK. Check FIREBASE_ADMIN_SDK_CONFIG environment variable and its Base64 encoding.', error);
  // This error will prevent the function from running, which is good for security.
}

exports.handler = async (event, context) => {
  // Ensure it's a POST request with a body
  if (event.httpMethod !== 'POST' || !event.body) {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed or Missing Body' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  let uidToSetAdmin;
  let isAdminClaim;

  try {
    const requestBody = JSON.parse(event.body);
    uidToSetAdmin = requestBody.uid;
    isAdminClaim = requestBody.isAdmin; // This should be true for your admin user

    if (!uidToSetAdmin || typeof isAdminClaim !== 'boolean') {
      throw new Error('Missing or invalid "uid" (string) or "isAdmin" (boolean) in request body.');
    }

    // --- Critical Security Check (for a one-time, manual use case) ---
    // For a simple one-time setup, you might rely on deleting the function afterward.
    // For anything more permanent, you'd add:
    // 1. A secret key in the request body that matches a Netlify ENV var.
    // 2. Or, check context.clientContext.user if you're using Netlify Identity and want to restrict calls.
    // Since this is for a one-time personal admin setup, we'll keep it simple
    // but with the strong warning to delete after use.
    // -----------------------------------------------------------------

  } catch (error) {
    console.error('Error parsing request body:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Bad Request: ${error.message}` }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    await admin.auth().setCustomUserClaims(uidToSetAdmin, { admin: isAdminClaim });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Custom claim 'admin' set to ${isAdminClaim} for user ${uidToSetAdmin}.` }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Error setting custom claim:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};