const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { admin } = require('../../firebaseAdmin');
const { generateUniqueInviteCode } = require('../../utils/inviteCode');
const { NotificationService } = require('../../services/notificationService');

const ALLOWED_SCOPES = ['recaps:read', 'journal:read', 'comments:write', 'likes:write'];
function sanitizeScopes(requested) {
  const arr = Array.isArray(requested) ? requested : [];
  const filtered = [...new Set(arr.filter((s) => ALLOWED_SCOPES.includes(s)))];
  return filtered.length ? filtered : ['recaps:read'];
}

// v2 Callable: familyCreateInvitation (old name was 'family-createInvitation')
const familyCreateInvitation = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  try {
    const { inviteeContact, scopes: requestedScopes } = request.data || {};
    if (!inviteeContact) throw new HttpsError('invalid-argument', 'inviteeContact is required');

    const scopes = sanitizeScopes(requestedScopes);
    const inviterId = request.auth.uid;
    const inviteCode = await generateUniqueInviteCode(6);
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    const invitation = {
      inviterId,
      inviteeContact: String(inviteeContact).trim(),
      role: 'viewer',
      status: 'pending',
      inviteCode,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      scopes,
    };

    const docRef = await admin.firestore().collection('invitations').add(invitation);
    return { invitationId: docRef.id, inviteCode, expiresAt: expiresAt.toDate().toISOString(), scopes };
  } catch (error) {
    console.error('familyCreateInvitation callable error:', error);
    throw new HttpsError('internal', 'Internal Server Error');
  }
});

// v2 Callable: familyAcceptInvitation (old name was 'family-acceptInvitation')
const familyAcceptInvitation = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  try {
    const { inviteCode: rawCode } = request.data || {};
    const inviteCode = String(rawCode || '').trim().toUpperCase();
    if (!inviteCode || inviteCode.length < 6) {
      throw new HttpsError('invalid-argument', 'A valid inviteCode is required');
    }

    const inviteSnap = await admin
      .firestore()
      .collection('invitations')
      .where('inviteCode', '==', inviteCode)
      .limit(1)
      .get();
    if (inviteSnap.empty) throw new HttpsError('not-found', 'Invitation not found');

    const inviteDoc = inviteSnap.docs[0];
    const invite = inviteDoc.data();
    if (invite.status !== 'pending') throw new HttpsError('failed-precondition', 'Invitation is not pending');
    if (invite.expiresAt && invite.expiresAt.toMillis && invite.expiresAt.toMillis() < Date.now()) {
      throw new HttpsError('failed-precondition', 'Invitation has expired');
    }

    const ownerId = invite.inviterId;
    const viewerId = request.auth.uid;

    const accessId = `${ownerId}_${viewerId}`;
    const accessRef = admin.firestore().collection('sharedAccess').doc(accessId);
    const existingAccess = await accessRef.get();
    const scopes = Array.isArray(invite.scopes) && invite.scopes.length ? sanitizeScopes(invite.scopes) : ['recaps:read'];

    const batch = admin.firestore().batch();
    if (existingAccess.exists) {
      batch.update(accessRef, {
        scopes,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      batch.set(accessRef, {
        ownerId,
        viewerId,
        scopes,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    batch.update(inviteDoc.ref, { status: 'accepted', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    await batch.commit();

    // Set viewer accountType claim to 'view-only' (best effort)
    try {
      const userRecord = await admin.auth().getUser(viewerId);
      const existingClaims = userRecord.customClaims || {};
      if (existingClaims.accountType !== 'view-only') {
        await admin.auth().setCustomUserClaims(viewerId, { ...existingClaims, accountType: 'view-only' });
      }

      const db = admin.firestore();
      const userRef = db.collection('users').doc(viewerId);
      const userSnap = await userRef.get();
      const now = admin.firestore.FieldValue.serverTimestamp();
      const email = userRecord.email || '';
      const fallbackName = (userRecord.displayName && userRecord.displayName.trim().length > 0)
        ? userRecord.displayName
        : (email ? email.split('@')[0] : '');

      if (!userSnap.exists) {
        await userRef.set({
          uid: viewerId,
          name: fallbackName,
          email,
          lifestage: null,
          children: [],
          subscription: { plan: 'free', status: 'trial', startDate: now },
          onboarded: false,
          createdAt: now,
          updatedAt: now,
          accountType: 'view-only',
          parentUserId: ownerId,
          profileComplete: false,
        }, { merge: true });
      } else {
        await userRef.set({
          updatedAt: now,
          accountType: 'view-only',
          parentUserId: ownerId,
          profileComplete: (userSnap.data()?.profileComplete === true) ? true : false,
        }, { merge: true });
      }
    } catch (claimErr) {
      console.error('Error setting viewer claims or user doc:', claimErr);
    }

    // Notify inviter (best effort)
    try {
      const notificationService = new NotificationService();
      await notificationService.sendFamilyInvitationAcceptedNotification(ownerId, viewerId);
    } catch (notifyErr) {
      console.error('Notification error (family invitation accepted):', notifyErr);
    }

    return { success: true, ownerId, viewerId, accessId, scopes };
  } catch (error) {
    console.error('familyAcceptInvitation callable error:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Internal Server Error');
  }
});

// v2 Callable: familyUpdatePermissions
const familyUpdatePermissions = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  try {
    const { viewerId, scopes: requestedScopes } = request.data || {};
    if (!viewerId) throw new HttpsError('invalid-argument', 'viewerId is required');
    const scopes = sanitizeScopes(requestedScopes);
    const ownerId = request.auth.uid;

    const accessId = `${ownerId}_${viewerId}`;
    const accessRef = admin.firestore().collection('sharedAccess').doc(accessId);
    const doc = await accessRef.get();
    if (!doc.exists) throw new HttpsError('not-found', 'Shared access not found');

    await accessRef.update({ scopes, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return { success: true, accessId, scopes };
  } catch (error) {
    console.error('familyUpdatePermissions callable error:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Internal Server Error');
  }
});

// v2 Callable: familyRevokeAccess
const familyRevokeAccess = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  try {
    const { viewerId } = request.data || {};
    if (!viewerId) throw new HttpsError('invalid-argument', 'viewerId is required');
    const ownerId = request.auth.uid;

    const accessId = `${ownerId}_${viewerId}`;
    const accessRef = admin.firestore().collection('sharedAccess').doc(accessId);
    const doc = await accessRef.get();
    if (!doc.exists) {
      return { success: true, accessId, alreadyRevoked: true };
    }
    await accessRef.delete();
    return { success: true, accessId };
  } catch (error) {
    console.error('familyRevokeAccess callable error:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Internal Server Error');
  }
});

// v2 Callable: familyGetSharedAccess
const familyGetSharedAccess = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  try {
    const uid = request.auth.uid;
    const db = admin.firestore();

    const [asOwnerSnap, asViewerSnap] = await Promise.all([
      db.collection('sharedAccess').where('ownerId', '==', uid).get(),
      db.collection('sharedAccess').where('viewerId', '==', uid).get(),
    ]);

    const docs = [...asOwnerSnap.docs, ...asViewerSnap.docs];
    const dedupMap = new Map();
    docs.forEach((d) => dedupMap.set(d.id, d));
    const sharedAccess = Array.from(dedupMap.values()).map((d) => {
      const val = d.data();
      return {
        id: d.id,
        ownerId: val.ownerId,
        viewerId: val.viewerId,
        scopes: Array.isArray(val.scopes) ? sanitizeScopes(val.scopes) : ['recaps:read'],
        createdAt: (val.createdAt?.toDate?.().toISOString?.() || ''),
        updatedAt: (val.updatedAt?.toDate?.().toISOString?.() || ''),
      };
    });

    return { sharedAccess };
  } catch (error) {
    console.error('familyGetSharedAccess callable error:', error);
    throw new HttpsError('internal', 'Internal Server Error');
  }
});

// v2 Callable: familyGetInvitations
const familyGetInvitations = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  try {
    const uid = request.auth.uid;
    const snap = await admin
      .firestore()
      .collection('invitations')
      .where('inviterId', '==', uid)
      .get();

    const invitations = snap.docs.map((d) => {
      const v = d.data();
      return {
        id: d.id,
        inviterId: v.inviterId,
        inviteeContact: v.inviteeContact,
        role: v.role,
        status: v.status,
        inviteCode: v.inviteCode,
        expiresAt: (v.expiresAt?.toDate?.().toISOString?.() || ''),
        scopes: Array.isArray(v.scopes) ? sanitizeScopes(v.scopes) : ['recaps:read'],
        createdAt: (v.createdAt?.toDate?.().toISOString?.() || ''),
        updatedAt: (v.updatedAt?.toDate?.().toISOString?.() || ''),
      };
    });

    return { invitations };
  } catch (error) {
    console.error('familyGetInvitations callable error:', error);
    throw new HttpsError('internal', 'Internal Server Error');
  }
});

// v2 Callable: familyGetAccountStatus
const familyGetAccountStatus = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  try {
    const uid = request.auth.uid;
    const claimType = request.auth?.token?.accountType;
    let accountType = claimType === 'view-only' ? 'view-only' : 'full';

    const db = admin.firestore();
    const [asOwnerSnap, asViewerSnap] = await Promise.all([
      db.collection('sharedAccess').where('ownerId', '==', uid).get(),
      db.collection('sharedAccess').where('viewerId', '==', uid).get(),
    ]);

    if (accountType !== 'view-only') {
      try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists && userDoc.data()?.accountType === 'view-only') {
          accountType = 'view-only';
        }
      } catch (e) {
        console.warn('Could not read users doc for accountType fallback:', e);
      }

      if (accountType !== 'view-only') {
        const hasViewer = !asViewerSnap.empty;
        const hasOwner = !asOwnerSnap.empty;
        if (hasViewer && !hasOwner) {
          accountType = 'view-only';
        }
      }
    }

    const docs = [...asOwnerSnap.docs, ...asViewerSnap.docs];
    const dedupMap = new Map();
    docs.forEach((d) => dedupMap.set(d.id, d));
    const sharedAccess = Array.from(dedupMap.values()).map((d) => {
      const val = d.data();
      return {
        id: d.id,
        ownerId: val.ownerId,
        viewerId: val.viewerId,
        scopes: Array.isArray(val.scopes) ? sanitizeScopes(val.scopes) : ['recaps:read'],
        createdAt: (val.createdAt?.toDate?.().toISOString?.() || ''),
        updatedAt: (val.updatedAt?.toDate?.().toISOString?.() || ''),
      };
    });

    return { accountType, sharedAccess };
  } catch (error) {
    console.error('familyGetAccountStatus callable error:', error);
    throw new HttpsError('internal', 'Internal Server Error');
  }
});

module.exports = {
  familyCreateInvitation,
  familyAcceptInvitation,
  familyUpdatePermissions,
  familyRevokeAccess,
  familyGetSharedAccess,
  familyGetInvitations,
  familyGetAccountStatus,
};
