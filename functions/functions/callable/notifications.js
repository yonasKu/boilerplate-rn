const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { admin } = require('../../firebaseAdmin');
const { NotificationService } = require('../../services/notificationService');

// v2 Callable: sendTestNotification
const sendTestNotification = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  try {
    const { token, title, body } = request.data || {};
    if (!token) throw new HttpsError('invalid-argument', 'The request must include a "token" field.');

    const payload = {
      notification: {
        title: title || 'Test Notification',
        body: body || 'This is a test from your SproutBook cloud!',
        sound: 'default',
      },
    };

    const response = await admin.messaging().sendToDevice(token, payload);
    response.results?.forEach((result) => {
      const error = result.error;
      if (error) console.error('Failure sending notification to', token, error);
    });
    return { success: true, response };
  } catch (error) {
    console.error('sendTestNotification callable error:', error);
    throw new HttpsError('internal', 'Internal Server Error');
  }
});

// v2 Callable: storeDeviceToken (parity with previous name)
const storeDeviceToken = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  try {
    const { token, platform } = request.data || {};
    if (!token) throw new HttpsError('invalid-argument', 'The request must include a "token" field.');
    const userId = request.auth.uid;
    const notificationService = new NotificationService();
    const result = await notificationService.storeDeviceToken(userId, token, platform);
    return result;
  } catch (error) {
    console.error('storeDeviceToken callable error:', error);
    throw new HttpsError('internal', 'Internal Server Error');
  }
});

// v2 Callable: removeDeviceToken
const removeDeviceToken = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  try {
    const { token } = request.data || {};
    if (!token) throw new HttpsError('invalid-argument', 'The request must include a "token" field.');
    const userId = request.auth.uid;
    const notificationService = new NotificationService();
    const result = await notificationService.removeDeviceToken(userId, token);
    return result;
  } catch (error) {
    console.error('removeDeviceToken callable error:', error);
    throw new HttpsError('internal', 'Internal Server Error');
  }
});

module.exports = {
  sendTestNotification,
  storeDeviceToken,
  removeDeviceToken,
};
