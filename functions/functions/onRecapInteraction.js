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

      // Push notification
      await notificationService.sendPushNotification(ownerId, {
        title,
        body,
        data: {
          type: 'recap_comment',
          recapId: comment.recapId,
          commentId: context.params.commentId || '',
        },
      });

      // Prepare commenter brief (name + avatar) for client rendering
      let commenterBrief = { name: comment.userName || 'Someone', profileImageUrl: '' };
      try {
        const [userSnap, authUser] = await Promise.all([
          db.collection('users').doc(comment.userId).get(),
          admin.auth().getUser(comment.userId).catch(() => null),
        ]);
        const data = userSnap?.exists ? (userSnap.data() || {}) : {};
        const email = data.email || authUser?.email || '';
        const emailLocal = email ? String(email).split('@')[0] : '';
        const name = data.name || authUser?.displayName || comment.userName || emailLocal || 'Someone';
        const profileImageUrl = data.profileImageUrl || authUser?.photoURL || '';
        commenterBrief = { name, profileImageUrl };
      } catch (e) {
        console.warn('Failed to enrich commenter brief for notification:', e);
      }

      // In-app notification (denormalized actor info for UI)
      await db.collection('notifications').add({
        userId: ownerId,
        type: 'recap_comment',
        title,
        body,
        recapId: comment.recapId,
        commentId: context.params.commentId || '',
        comment: (comment.text || '').toString(),
        commenterId: comment.userId,
        commenterName: comment.userName || commenterBrief.name || null,
        users: [
          { name: commenterBrief.name, avatar: commenterBrief.profileImageUrl || null }
        ],
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
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

        // Get liker display brief for message and UI (name + avatar)
        let likerName = 'Someone';
        let likerAvatar = '';
        try {
          const [likerSnap, authUser] = await Promise.all([
            db.collection('users').doc(likerId).get(),
            admin.auth().getUser(likerId).catch(() => null),
          ]);
          if (likerSnap.exists) {
            const u = likerSnap.data() || {};
            likerName = u.displayName || u.name || likerName;
            likerAvatar = u.profileImageUrl || likerAvatar;
          }
          if (!likerAvatar && authUser?.photoURL) likerAvatar = authUser.photoURL;
          if (likerName === 'Someone' && authUser?.displayName) likerName = authUser.displayName;
        } catch {}

        // Push notification
        await notificationService.sendPushNotification(ownerId, {
          title: '❤️ New like on your recap',
          body: `${likerName} liked your recap`,
          data: {
            type: 'recap_like',
            recapId: context.params.recapId,
            likerId,
          },
        });

        // In-app notification (denormalized liker info for UI)
        await db.collection('notifications').add({
          userId: ownerId,
          type: 'recap_like',
          title: '❤️ New like on your recap',
          body: `${likerName} liked your recap`,
          recapId: context.params.recapId,
          likerId,
          users: [ { name: likerName, avatar: likerAvatar || null } ],
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return null;
    } catch (err) {
      console.error('onRecapLikesUpdated error:', err);
      return null;
    }
  });
