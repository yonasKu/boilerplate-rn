const functions = require('firebase-functions');
const { admin } = require('../firebaseAdmin');

// Propagate user profile changes to denormalized locations
// - sharedAccess: update owner/viewer briefs
// - invitations: update acceptedProfile when inviteeUserId matches
exports.onUserProfileUpdated = functions.firestore
  .document('users/{uid}')
  .onWrite(async (change, context) => {
    const uid = context.params.uid;
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;

    // If deleted, skip
    if (!after) return null;

    // Check if relevant fields changed
    const changed = !before || (
      before.name !== after.name ||
      before.profileImageUrl !== after.profileImageUrl ||
      before.email !== after.email
    );
    if (!changed) return null;

    const db = admin.firestore();

    const brief = {
      uid,
      name: after.name || (after.email ? String(after.email).split('@')[0] : 'User'),
      profileImageUrl: after.profileImageUrl || ''
    };

    const updates = [];

    // Update sharedAccess where this user is viewer
    try {
      const viewerSnap = await db.collection('sharedAccess').where('viewerId', '==', uid).get();
      viewerSnap.forEach(doc => {
        updates.push(doc.ref.update({ viewer: brief, updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
      });
    } catch (e) {
      console.warn('Failed updating sharedAccess viewer briefs for', uid, e);
    }

    // Update sharedAccess where this user is owner
    try {
      const ownerSnap = await db.collection('sharedAccess').where('ownerId', '==', uid).get();
      ownerSnap.forEach(doc => {
        updates.push(doc.ref.update({ owner: brief, updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
      });
    } catch (e) {
      console.warn('Failed updating sharedAccess owner briefs for', uid, e);
    }

    // Update invitations where this user accepted
    try {
      const invSnap = await db.collection('invitations').where('inviteeUserId', '==', uid).get();
      invSnap.forEach(doc => {
        updates.push(doc.ref.update({ acceptedProfile: brief, updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
      });
    } catch (e) {
      console.warn('Failed updating invitations acceptedProfile for', uid, e);
    }

    await Promise.allSettled(updates);
    return null;
  });
