const functions = require("firebase-functions");
const { admin } = require('./firebaseAdmin');

// Admin is already initialized in firebaseAdmin.js

// --- Automated Recap Functions ---
const { AutomatedRecapService } = require('./services/recapGenerator');

// Initialize services
const recapService = new AutomatedRecapService();

// Manual trigger functions for testing
exports.generateWeeklyRecap = functions.https.onCall(async (data, context) => {
  const { userId, childId, startDate, endDate } = data;
  
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const weekRange = { start: new Date(startDate), end: new Date(endDate) };
  return await recapService.generateWeeklyRecap(userId, childId, weekRange);
});

exports.generateMonthlyRecap = functions.https.onCall(async (data, context) => {
  const { userId, childId, startDate, endDate } = data;
  
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const monthRange = { start: new Date(startDate), end: new Date(endDate) };
  return await recapService.generateMonthlyRecap(userId, childId, monthRange);
});

exports.generateYearlyRecap = functions.https.onCall(async (data, context) => {
  const { userId, childId, startDate, endDate } = data;
  
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const yearRange = { start: new Date(startDate), end: new Date(endDate) };
  return await recapService.generateYearlyRecap(userId, childId, yearRange);
});


// --- Test Functions ---

/**
 * A test function to send a push notification to a specific device token.
 */
exports.sendTestNotification = functions.https.onCall(async (data, context) => {
  const { token, title, body } = data;

  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "token" argument.');
  }

  const payload = {
    notification: {
      title: title || 'Test Notification',
      body: body || 'This is a test from your SproutBook cloud!',
      sound: 'default',
    },
  };

  try {
    const response = await admin.messaging().sendToDevice(token, payload);
    console.log('Successfully sent message:', response);
    response.results.forEach(result => {
      const error = result.error;
      if (error) {
        console.error('Failure sending notification to', token, error);
      }
    });
    return { success: true, response };
  } catch (error) {
    console.error('Error sending message:', error);
    throw new functions.https.HttpsError('internal', 'Error sending notification.');
  }
});
