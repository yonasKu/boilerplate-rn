// Load environment variables
require('dotenv').config();

// Only set emulator settings when running locally (not in production)
const isEmulator = process.env.NODE_ENV === 'development' || 
                   process.env.FUNCTIONS_EMULATOR === 'true' ||
                   !!process.env.FIRESTORE_EMULATOR_HOST;

if (isEmulator && process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
}
if (isEmulator && process.env.AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.AUTH_EMULATOR_HOST;
}
if (isEmulator && process.env.STORAGE_EMULATOR_HOST) {
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = process.env.STORAGE_EMULATOR_HOST;
}

const admin = require('firebase-admin');

// Initialize Firebase Admin with Application Default Credentials
function initializeFirebase() {
  console.log('firebaseAdmin.js: Initializing Firebase Admin SDK...');
  if (!admin.apps.length) {
    console.log('firebaseAdmin.js: No existing Firebase app found. Starting new initialization.');

    // Log all relevant environment variables for debugging
    console.log(`firebaseAdmin.js: GCLOUD_PROJECT=${process.env.GCLOUD_PROJECT}`);
    console.log(`firebaseAdmin.js: GOOGLE_CLOUD_PROJECT=${process.env.GOOGLE_CLOUD_PROJECT}`);
    console.log(`firebaseAdmin.js: PROJECT_ID=${process.env.PROJECT_ID}`);
    console.log(`firebaseAdmin.js: FIREBASE_CONFIG exists? ${!!process.env.FIREBASE_CONFIG}`);

    // Determine project ID from runtime environment
    let runtimeProjectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
    if (runtimeProjectId) {
      console.log(`firebaseAdmin.js: Found project ID from GCLOUD_PROJECT/GOOGLE_CLOUD_PROJECT: ${runtimeProjectId}`);
    } else {
      console.log('firebaseAdmin.js: GCLOUD_PROJECT/GOOGLE_CLOUD_PROJECT not set.');
    }

    // Fallback for local development with FIREBASE_CONFIG
    if (!runtimeProjectId && process.env.FIREBASE_CONFIG) {
      console.log('firebaseAdmin.js: Attempting to use FIREBASE_CONFIG.');
      try {
        const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
        runtimeProjectId = firebaseConfig.projectId;
        console.log(`firebaseAdmin.js: Found project ID from FIREBASE_CONFIG: ${runtimeProjectId}`);
      } catch (e) {
        console.error('firebaseAdmin.js: Error parsing FIREBASE_CONFIG:', e);
      }
    }

    // Fallback to PROJECT_ID env var if available
    if (!runtimeProjectId && process.env.PROJECT_ID) {
      console.log('firebaseAdmin.js: Attempting to use PROJECT_ID env var.');
      runtimeProjectId = process.env.PROJECT_ID;
      console.log(`firebaseAdmin.js: Found project ID from PROJECT_ID: ${runtimeProjectId}`);
    }

    const options = {};
    if (runtimeProjectId) {
      options.projectId = runtimeProjectId;
      console.log(`firebaseAdmin.js: Initializing with explicit projectId: ${runtimeProjectId}`);
    } else {
      console.warn('firebaseAdmin.js: No Project ID found. Initializing with default credentials.');
    }

    try {
      admin.initializeApp(options);
      console.log(`firebaseAdmin.js: Firebase Admin SDK initialized successfully. Final Project ID: ${admin.app().options.projectId}`);
    } catch (error) {
      console.error('firebaseAdmin.js: Firebase Admin SDK initialization FAILED:', error);
      // Re-throw the error to ensure the function fails fast if initialization is unsuccessful
      throw error;
    }
  } else {
    console.log(`firebaseAdmin.js: Firebase Admin SDK already initialized. Project ID: ${admin.app().options.projectId}`);
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
