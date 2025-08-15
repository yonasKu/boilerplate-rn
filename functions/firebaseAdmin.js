const admin = require('firebase-admin');

// Initialize Firebase Admin with Application Default Credentials
function initializeFirebase() {
  try {
    if (!admin.apps.length) {
      // This is the modern, secure way. It automatically finds credentials
      // when running on Google Cloud or when you are logged in via `gcloud`.
      admin.initializeApp();
      console.log('Firebase Admin SDK initialized successfully using Application Default Credentials.');
    }
  } catch (error) {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK.', error);
    // If ADC fails, the application cannot connect to Firebase services.
    // Throwing an error is appropriate to prevent the function from running
    // without proper authentication.
    throw new Error('Firebase Admin initialization failed.');
  }
}

// Initialize Firebase
initializeFirebase();

// Configure Firestore settings
const db = admin.firestore();
db.settings({ 
  ignoreUndefinedProperties: true,
  timestampsInSnapshots: true 
});

// Enhanced logging for debugging
const logFirestoreError = (error, operation) => {
  console.error(`Firestore ${operation} error:`, {
    message: error.message,
    code: error.code,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  admin,
  db,
  logFirestoreError
};
