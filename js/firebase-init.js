// Contents of TCP - MyTornPersonalAssistant/js/firebase-init.js
// MAKE SURE THIS FILE IS LOADED BEFORE ANY OTHER SCRIPT THAT USES 'auth' or 'db'

const firebaseConfig = {
  apiKey: "AIzaSyAI5QB7LbFyndbk_khADbKb33iqLSO4EOw", // Your actual Firebase config
  authDomain: "mytorn-d03ae.firebaseapp.com",
  projectId: "mytorn-d03ae",
  storageBucket: "mytorn-d03ae.firebasestorage.app",
  messagingSenderId: "205970466308",
  appId: "1:205970466308:web:b2f8ec5d1a38ef05213751"
};

let app;
// Initialize Firebase only if the firebase library is loaded and no apps are initialized
if (typeof firebase !== 'undefined' && firebase.apps && !firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else if (typeof firebase !== 'undefined' && firebase.app) { // if already initialized, get the app
  app = firebase.app();
}

// Assign auth and db to the window object to make them globally accessible
// This is the CRITICAL CHANGE
window.auth = (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') ? firebase.auth() : undefined;
window.db = (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') ? firebase.firestore() : undefined;


if (!window.auth && typeof firebase !== 'undefined') { 
  console.error("Firebase auth object could not be initialized in firebase-init.js. Ensure Firebase App and Auth SDKs are loaded correctly before this script.");
} else if (typeof firebase === 'undefined') {
  console.error("Firebase library not loaded. `firebase-init.js` cannot initialize Firebase.");
}

// Check if Firestore was initialized
if (!window.db && typeof firebase !== 'undefined') {
  console.error("Firebase Firestore object could not be initialized in firebase-init.js. Ensure Firebase Firestore SDK is loaded correctly before this script.");
}