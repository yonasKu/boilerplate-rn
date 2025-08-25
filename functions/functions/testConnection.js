const functions = require('firebase-functions');
const { onRequest } = require('firebase-functions/v2/https');
const { admin } = require('../firebaseAdmin');

/**
 * Test function to verify production connection
 * This function will show us exactly what environment we're in
 */
exports.testConnection = onRequest(
  { region: 'us-central1', invoker: 'private', environmentVariables: {} },
  async (req, res) => {
  try {
    console.log('=== CONNECTION TEST STARTED ===');
    
    // Log environment variables
    console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('PROJECT_ID:', process.env.PROJECT_ID || 'not set');
    
    // Check if emulator settings exist
    console.log('FIRESTORE_EMULATOR_HOST:', process.env.FIRESTORE_EMULATOR_HOST || 'not set');
    console.log('AUTH_EMULATOR_HOST:', process.env.AUTH_EMULATOR_HOST || 'not set');
    
    // Environment detection logic
    const isEmulator = process.env.NODE_ENV === 'development' || 
                       process.env.FUNCTIONS_EMULATOR === 'true' ||
                       !!process.env.FIRESTORE_EMULATOR_HOST;
    
    console.log('Is Emulator Mode:', isEmulator);
    
    if (isEmulator) {
      console.log('❌ WARNING: Still using emulator settings!');
      console.log('This should NOT happen in production!');
    } else {
      console.log('✅ SUCCESS: Using production settings!');
      console.log('✅ Will connect to real Firestore!');
    }
    
    // Test actual Firestore connection
    console.log('Testing Firestore connection...');
    const testDoc = await admin.firestore().collection('test').limit(1).get();
    console.log('✅ Firestore connection successful!');
    console.log('✅ Documents in test collection:', testDoc.size);
    
    console.log('=== CONNECTION TEST COMPLETED ===');
    
    res.status(200).json({
      success: true,
      message: 'Connection test completed - check logs for details',
      isEmulator: isEmulator,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ CONNECTION TEST FAILED:', error.message);
    console.error('Error details:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
