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


// --- Notification Device Token Management ---
const { NotificationService } = require('./services/notificationService');
const notificationService = new NotificationService();
const { sendDailyReminders, sendWeeklyReminders, sendMonthlyReminders } = require('./scheduled/reminders');

/**
 * Registers a device token for the authenticated user to receive push notifications.
 * Expects { token: string, platform: string } in the data payload.
 */
exports.registerDeviceToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { token, platform } = data;
  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "token" argument.');
  }

  const userId = context.auth.uid;
  try {
    return await notificationService.storeDeviceToken(userId, token, platform);
  } catch (error) {
    console.error(`Error in registerDeviceToken for user ${userId}:`, error);
    throw new functions.https.HttpsError('internal', 'Failed to register device token.', error.message);
  }
});

/**
 * Removes a device token for the authenticated user, stopping push notifications to that device.
 * Expects { token: string } in the data payload.
 */
exports.removeDeviceToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { token } = data;
  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "token" argument.');
  }

  const userId = context.auth.uid;
  try {
    return await notificationService.removeDeviceToken(userId, token);
  } catch (error) {
    console.error(`Error in removeDeviceToken for user ${userId}:`, error);
    throw new functions.https.HttpsError('internal', 'Failed to remove device token.', error.message);
  }
});


// --- Scheduled Functions ---

/**
 * A scheduled function that runs every day at 9:00 AM to send daily reminders.
 */
exports.dailyReminderScheduler = functions.pubsub
  .schedule('every day 09:00')
  .timeZone('America/New_York') // Example timezone, adjust as needed
  .onRun(async (context) => {
    try {
      await sendDailyReminders();
      return null;
    } catch (error) {
      console.error('Error running daily reminder scheduler:', error);
      return null;
    }
  });

/**
 * A scheduled function that runs every Sunday at 10:00 AM to send weekly recap reminders.
 */
exports.weeklyReminderScheduler = functions.pubsub
  .schedule('every sunday 10:00')
  .timeZone('America/New_York') // Example timezone, adjust as needed
  .onRun(async (context) => {
    try {
      await sendWeeklyReminders();
      return null;
    } catch (error) {
      console.error('Error running weekly reminder scheduler:', error);
      return null;
    }
  });

/**
 * A scheduled function that runs on the 1st of every month at 10:00 AM to send monthly recap reminders.
 */
exports.monthlyReminderScheduler = functions.pubsub
  .schedule('1 of month 10:00')
  .timeZone('America/New_York') // Example timezone, adjust as needed
  .onRun(async (context) => {
    try {
      await sendMonthlyReminders();
      return null;
    } catch (error) {
      console.error('Error running monthly reminder scheduler:', error);
      return null;
    }
  });
