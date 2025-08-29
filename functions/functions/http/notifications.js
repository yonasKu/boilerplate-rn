const { onRequest } = require('firebase-functions/v2/https');
const { admin } = require('../../firebaseAdmin');
const { NotificationService } = require('../../services/notificationService');

async function requireAuth(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return null;
  }
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/i);
  if (!match) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return null;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
    return decoded;
  } catch (e) {
    res.status(401).json({ error: 'Invalid ID token' });
    return null;
  }
}

const sendTestNotification = onRequest(
  { region: 'us-central1', invoker: 'public' },
  async (req, res) => {
    try {
      const decoded = await requireAuth(req, res);
      if (!decoded) return;

      const { token, title, body } = req.body || {};
      if (!token) {
        return res.status(400).json({ error: 'The request must include a "token" field.' });
      }

      const payload = {
        notification: {
          title: title || 'Test Notification',
          body: body || 'This is a test from your SproutBook cloud!',
          sound: 'default',
        },
      };

      const response = await admin.messaging().sendToDevice(token, payload);
      console.log('Successfully sent message:', response);
      response.results.forEach(result => {
        const error = result.error;
        if (error) {
          console.error('Failure sending notification to', token, error);
        }
      });
      return res.json({ success: true, response });
    } catch (error) {
      console.error('sendTestNotification error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

const registerDeviceToken = onRequest(
  { region: 'us-central1', invoker: 'public' },
  async (req, res) => {
    try {
      const decoded = await requireAuth(req, res);
      if (!decoded) return;

      const { token, platform } = req.body || {};
      if (!token) {
        return res.status(400).json({ error: 'The request must include a "token" field.' });
      }
      const userId = decoded.uid;
      const notificationService = new NotificationService();
      const result = await notificationService.storeDeviceToken(userId, token, platform);
      return res.json(result);
    } catch (error) {
      console.error('registerDeviceToken error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

const removeDeviceToken = onRequest(
  { region: 'us-central1', invoker: 'public' },
  async (req, res) => {
    try {
      const decoded = await requireAuth(req, res);
      if (!decoded) return;

      const { token } = req.body || {};
      if (!token) {
        return res.status(400).json({ error: 'The request must include a "token" field.' });
      }
      const userId = decoded.uid;
      const notificationService = new NotificationService();
      const result = await notificationService.removeDeviceToken(userId, token);
      return res.json(result);
    } catch (error) {
      console.error('removeDeviceToken error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

module.exports = {
  sendTestNotification,
  registerDeviceToken,
  removeDeviceToken,
};
