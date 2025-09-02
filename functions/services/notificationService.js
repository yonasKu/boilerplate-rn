const { admin } = require('../firebaseAdmin');

/**
 * A service for handling push notifications and device token management.
 */
class NotificationService {
  constructor() {
    this.db = admin.firestore();
    this.messaging = admin.messaging();
  }

  /**
   * Stores or updates a user's device token.
   * @param {string} userId - The ID of the user.
   * @param {string} token - The FCM device token.
   * @param {string} platform - The device platform (e.g., 'ios', 'android').
   * @returns {Promise<{success: boolean}>}
   */
  async storeDeviceToken(userId, token, platform = 'unknown') {
    if (!userId || !token) {
      throw new Error('User ID and token are required.');
    }
    const deviceRef = this.db.collection('users').doc(userId).collection('devices').doc(token);
    try {
      await deviceRef.set({
        token,
        platform,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUsed: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      console.log(`Successfully stored token for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error(`Error storing device token for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Removes a user's device token.
   * @param {string} userId - The ID of the user.
   * @param {string} token - The FCM device token to remove.
   * @returns {Promise<{success: boolean}>}
   */
  async removeDeviceToken(userId, token) {
    if (!userId || !token) {
      throw new Error('User ID and token are required.');
    }
    const deviceRef = this.db.collection('users').doc(userId).collection('devices').doc(token);
    try {
      await deviceRef.delete();
      console.log(`Successfully removed token for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error(`Error removing device token for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves all device tokens for a given user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<string[]>} - A list of device tokens.
   */
  async getUserDeviceTokens(userId) {
    try {
      const snapshot = await this.db.collection('users').doc(userId).collection('devices').get();
      if (snapshot.empty) {
        return [];
      }
      // Prefer stored token field; fall back to doc ID (we store tokens as doc IDs)
      const rawTokens = snapshot.docs.map((doc) => doc.data().token || doc.id);
      // Filter out invalid entries and de-duplicate
      const filtered = rawTokens
        .filter((t) => typeof t === 'string' && t.trim().length > 0)
        .map((t) => t.trim());
      return Array.from(new Set(filtered));
    } catch (error) {
      console.error(`Error getting device tokens for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Sends a push notification to a user.
   * @param {string} userId - The ID of the user.
   * @param {object} notification - The notification payload.
   * @param {string} notification.title - The title of the notification.
   * @param {string} notification.body - The body of the notification.
   * @param {object} [notification.data] - Additional data to send with the notification.
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async sendPushNotification(userId, notification) {
    // Validate userId input to avoid Firestore path errors
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      console.warn('sendPushNotification called with invalid userId:', userId);
      return { success: false, message: 'Invalid userId' };
    }

    const tokens = await this.getUserDeviceTokens(userId);

    if (!Array.isArray(tokens) || tokens.length === 0) {
      console.log(`No device tokens found for user ${userId}.`);
      return { success: false, message: 'No device tokens found for user.' };
    }

    const payload = {
      notification: {
        title: notification.title,
        body: notification.body,
        sound: 'default',
      },
      data: notification.data || {},
    };

    try {
      // Defensive: ensure we do not pass undefined/empty tokens to FCM
      const validTokens = tokens.filter((t) => typeof t === 'string' && t.trim().length > 0);
      if (validTokens.length === 0) {
        console.log(`No valid device tokens to send for user ${userId}.`);
        return { success: false, message: 'No valid device tokens for user.' };
      }

      const response = await this.messaging.sendToDevice(validTokens, payload);
      console.log(`Successfully sent notification to user ${userId}.`);
      await this.cleanupInvalidTokens(response, validTokens, userId);
      return { success: true };
    } catch (error) {
      console.error(`Error sending notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Removes invalid or unregistered tokens from Firestore.
   * @param {object} response - The response from admin.messaging().sendToDevice().
   * @param {string[]} tokens - The list of tokens that were sent the notification.
   * @param {string} userId - The ID of the user.
   * @private
   */
  async cleanupInvalidTokens(response, tokens, userId) {
    const invalidTokens = [];
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        console.error('Failure sending notification to', tokens[index], error);
        // Cleanup the tokens that are not registered anymore.
        if (
          error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(this.removeDeviceToken(userId, tokens[index]));
        }
      }
    });

    if (invalidTokens.length > 0) {
      await Promise.all(invalidTokens);
      console.log(`Cleaned up ${invalidTokens.length} invalid tokens for user ${userId}.`);
    }
  }

  /**
   * Sends a notification when a family invitation is accepted
   * @param {string} inviterId - The ID of the user who sent the invitation
   * @param {string} viewerId - The ID of the user who accepted the invitation
   * @returns {Promise<{success: boolean}>}
   */
  async sendFamilyInvitationAcceptedNotification(inviterId, viewerId) {
    try {
      // Get viewer's display name
      const viewerDoc = await this.db.collection('users').doc(viewerId).get();
      const viewerName = viewerDoc.exists ? (viewerDoc.data().displayName || 'Someone') : 'Someone';

      return await this.sendPushNotification(inviterId, {
        title: 'Family Invitation Accepted',
        body: `${viewerName} has accepted your family sharing invitation`,
        data: {
          type: 'family_invitation_accepted',
          viewerId: viewerId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending family invitation accepted notification:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = { NotificationService };
