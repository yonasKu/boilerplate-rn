const functions = require('firebase-functions');
const { admin } = require('../firebaseAdmin');
const { NotificationService } = require('../services/notificationService');

const db = admin.firestore();
const notificationService = new NotificationService();

/**
 * Helper: check a boolean preference with a default of true
 */
async function isPrefEnabled(userId, key, defaultValue = true) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return defaultValue;
    const prefs = (userDoc.data() || {}).notificationPreferences || {};
    const val = prefs[key];
    return typeof val === 'boolean' ? val : defaultValue;
  } catch (e) {
    console.warn('Pref check error for', userId, key, e);
    return defaultValue;
  }
}

/**
 * When a new comment is added to a recap, notify the recap owner (except the commenter themself).
 */
exports.onRecapCommentCreated = functions.firestore
  .document('recapComments/{commentId}')
  .onCreate(async (snap, context) => {
    const comment = snap.data();
    if (!comment || !comment.recapId || !comment.userId) return null;

    try {
      const recapRef = db.collection('recaps').doc(comment.recapId);
      const recapSnap = await recapRef.get();
      if (!recapSnap.exists) return null;

      const recap = recapSnap.data() || {};
      const ownerId = recap.userId || recap.ownerId;
      if (!ownerId || ownerId === comment.userId) return null; // don't notify self

      // Respect preference (default enabled)
      const allow = await isPrefEnabled(ownerId, 'commentNotifications', true);
      if (!allow) return null;

      const title = '💬 New comment on your recap';
      const preview = (comment.text || '').toString();
      const body = preview.length > 60 ? `${comment.userName || 'Someone'}: ${preview.slice(0, 57)}...` : `${comment.userName || 'Someone'}: ${preview}`;

      await notificationService.sendPushNotification(ownerId, {
        title,
        body,
        data: {
          type: 'recap_comment',
          recapId: comment.recapId,
          commentId: context.params.commentId || '',
        },
      });

      return null;
    } catch (err) {
      console.error('onRecapCommentCreated error:', err);
      return null;
    }
  });

/**
 * When likes are updated on a recap, notify the owner about NEW likes.
 * We diff the likes map between before and after, and notify for additions only.
 */
exports.onRecapLikesUpdated = functions.firestore
  .document('recaps/{recapId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data() || {};
      const after = change.after.data() || {};

      const beforeLikes = before.likes || {};
      const afterLikes = after.likes || {};

      // Find userIds that became true and were not true before
      const addedLikers = Object.keys(afterLikes).filter(
        (uid) => afterLikes[uid] === true && beforeLikes[uid] !== true
      );

      if (addedLikers.length === 0) return null;

      const ownerId = after.userId || after.ownerId;
      if (!ownerId) return null;

      // Respect preference (default enabled)
      const allow = await isPrefEnabled(ownerId, 'likeNotifications', true);
      if (!allow) return null;

      for (const likerId of addedLikers) {
        if (likerId === ownerId) continue; // don't notify self-like

        // Get liker display name for message
        let likerName = 'Someone';
        try {
          const likerSnap = await db.collection('users').doc(likerId).get();
          if (likerSnap.exists) {
            const u = likerSnap.data() || {};
            likerName = u.displayName || u.name || 'Someone';
          }
        } catch {}

        await notificationService.sendPushNotification(ownerId, {
          title: '❤️ New like on your recap',
          body: `${likerName} liked your recap`,
          data: {
            type: 'recap_like',
            recapId: context.params.recapId,
            likerId,
          },
        });
      }

      return null;
    } catch (err) {
      console.error('onRecapLikesUpdated error:', err);
      return null;
    }
  });
