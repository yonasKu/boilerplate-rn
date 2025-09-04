const { onRequest } = require('firebase-functions/v2/https');
const { admin } = require('../../firebaseAdmin');
const { generateUniqueInviteCode } = require('../../utils/inviteCode');
const { NotificationService } = require('../../services/notificationService');

const ALLOWED_SCOPES = ['recaps:read', 'journal:read', 'comments:write', 'likes:write'];
function sanitizeScopes(requested) {
  const arr = Array.isArray(requested) ? requested : [];
  const filtered = [...new Set(arr.filter(s => ALLOWED_SCOPES.includes(s)))];
  return filtered.length ? filtered : ['recaps:read'];
}

function mapCodeToStatus(code) {
  const map = {
    unauthenticated: 401,
    'invalid-argument': 400,
    'not-found': 404,
    'already-exists': 409,
    'failed-precondition': 412,
    'permission-denied': 403,
    internal: 500,
    unavailable: 503,
  };
  return map[code] || 400;
}

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

// POST /familyCreateInvitation
const familyCreateInvitation = onRequest({ region: 'us-central1', invoker: 'public' }, async (req, res) => {
  const decoded = await requireAuth(req, res);
  if (!decoded) return;
  try {
    const { inviteeContact, inviteeName: rawInviteeName, scopes: requestedScopes } = req.body || {};
    if (!inviteeContact) {
      return res.status(mapCodeToStatus('invalid-argument')).json({ error: 'inviteeContact is required' });
    }
    const scopes = sanitizeScopes(requestedScopes);
    const inviterId = decoded.uid;
    const inviteCode = await generateUniqueInviteCode(6);
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    const invitation = {
      inviterId,
      inviteeContact: String(inviteeContact).trim(),
      inviteeName: typeof rawInviteeName === 'string' ? String(rawInviteeName).trim() : '',
      role: 'viewer',
      status: 'pending',
      inviteCode,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      scopes,
    };

    const docRef = await admin.firestore().collection('invitations').add(invitation);
    return res.json({ invitationId: docRef.id, inviteCode, expiresAt: expiresAt.toDate().toISOString(), scopes, inviteeName: invitation.inviteeName });
  } catch (error) {
    console.error('familyCreateInvitation error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /familyAcceptInvitation
const familyAcceptInvitation = onRequest({ region: 'us-central1', invoker: 'public' }, async (req, res) => {
  const decoded = await requireAuth(req, res);
  if (!decoded) return;
  try {
    const { inviteCode: rawCode } = req.body || {};
    const inviteCode = String(rawCode || '').trim().toUpperCase();
    if (!inviteCode || inviteCode.length < 6) {
      return res.status(mapCodeToStatus('invalid-argument')).json({ error: 'A valid inviteCode is required' });
    }

    const inviteSnap = await admin.firestore()
      .collection('invitations')
      .where('inviteCode', '==', inviteCode)
      .limit(1)
      .get();

    if (inviteSnap.empty) {
      return res.status(mapCodeToStatus('not-found')).json({ error: 'Invitation not found' });
    }

    const inviteDoc = inviteSnap.docs[0];
    const invite = inviteDoc.data();
    if (invite.status !== 'pending') {
      return res.status(mapCodeToStatus('failed-precondition')).json({ error: 'Invitation is not pending' });
    }
    if (invite.expiresAt && invite.expiresAt.toMillis && invite.expiresAt.toMillis() < Date.now()) {
      return res.status(mapCodeToStatus('failed-precondition')).json({ error: 'Invitation has expired' });
    }

    const ownerId = invite.inviterId;
    const viewerId = decoded.uid;

    const accessId = `${ownerId}_${viewerId}`;
    const accessRef = admin.firestore().collection('sharedAccess').doc(accessId);
    const existingAccess = await accessRef.get();
    const scopes = Array.isArray(invite.scopes) && invite.scopes.length ? sanitizeScopes(invite.scopes) : ['recaps:read'];

    // Prepare profile briefs for denormalization
    const db = admin.firestore();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const [ownerUserSnap, viewerUserSnap, ownerAuth, viewerAuth] = await Promise.all([
      db.collection('users').doc(ownerId).get(),
      db.collection('users').doc(viewerId).get(),
      admin.auth().getUser(ownerId).catch(() => null),
      admin.auth().getUser(viewerId).catch(() => null),
    ]);

    const briefFrom = (uid, userDoc, authUser) => {
      const data = userDoc?.exists ? userDoc.data() : null;
      const email = data?.email || authUser?.email || '';
      const emailLocal = email ? String(email).split('@')[0] : '';
      const name = data?.name || authUser?.displayName || emailLocal || 'User';
      const profileImageUrl = data?.profileImageUrl || authUser?.photoURL || '';
      return { uid, name, profileImageUrl };
    };

    const ownerBrief = briefFrom(ownerId, ownerUserSnap, ownerAuth);
    const viewerBrief = briefFrom(viewerId, viewerUserSnap, viewerAuth);

    const batch = admin.firestore().batch();
    if (existingAccess.exists) {
      batch.update(accessRef, {
        scopes,
        updatedAt: now,
        viewer: viewerBrief,
        owner: ownerBrief,
      });
    } else {
      batch.set(accessRef, {
        ownerId,
        viewerId,
        scopes,
        createdAt: now,
        updatedAt: now,
        viewer: viewerBrief,
        owner: ownerBrief,
      });
    }
    // Update invitation: mark accepted and attach accepted profile info
    batch.update(inviteDoc.ref, {
      status: 'accepted',
      updatedAt: now,
      acceptedAt: now,
      inviteeUserId: viewerId,
      acceptedProfile: viewerBrief,
    });
    await batch.commit();

    try {
      const userRecord = await admin.auth().getUser(viewerId);
      const existingClaims = userRecord.customClaims || {};
      if (existingClaims.accountType !== 'view-only') {
        await admin.auth().setCustomUserClaims(viewerId, { ...existingClaims, accountType: 'view-only' });
      }

      const userRef = db.collection('users').doc(viewerId);
      const userSnap = await userRef.get();
      const now2 = admin.firestore.FieldValue.serverTimestamp();
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
          subscription: { plan: 'free', status: 'trial', startDate: now2 },
          onboarded: false,
          createdAt: now2,
          updatedAt: now2,
          accountType: 'view-only',
          parentUserId: ownerId,
          profileComplete: false,
        }, { merge: true });
      } else {
        await userRef.set({
          updatedAt: now2,
          accountType: 'view-only',
          parentUserId: ownerId,
          profileComplete: (userSnap.data()?.profileComplete === true) ? true : false,
        }, { merge: true });
      }
    } catch (claimErr) {
      console.error('Error setting viewer claims or user doc:', claimErr);
    }

    try {
      const notificationService = new NotificationService();
      await notificationService.sendFamilyInvitationAcceptedNotification(ownerId, viewerId);
    } catch (notifyErr) {
      console.error('Notification error (family invitation accepted):', notifyErr);
    }

    return res.json({ success: true, ownerId, viewerId, accessId, scopes });
  } catch (error) {
    console.error('familyAcceptInvitation error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /familyUpdatePermissions
const familyUpdatePermissions = onRequest({ region: 'us-central1', invoker: 'public' }, async (req, res) => {
  const decoded = await requireAuth(req, res);
  if (!decoded) return;
  try {
    const { viewerId, scopes: requestedScopes } = req.body || {};
    if (!viewerId) {
      return res.status(mapCodeToStatus('invalid-argument')).json({ error: 'viewerId is required' });
    }
    const scopes = sanitizeScopes(requestedScopes);
    const ownerId = decoded.uid;
    const accessId = `${ownerId}_${viewerId}`;
    const accessRef = admin.firestore().collection('sharedAccess').doc(accessId);
    const doc = await accessRef.get();
    if (!doc.exists) {
      return res.status(mapCodeToStatus('not-found')).json({ error: 'Shared access not found' });
    }

    await accessRef.update({ scopes, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return res.json({ success: true, accessId, scopes });
  } catch (error) {
    console.error('familyUpdatePermissions error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /familyRevokeAccess
const familyRevokeAccess = onRequest({ region: 'us-central1', invoker: 'public' }, async (req, res) => {
  const decoded = await requireAuth(req, res);
  if (!decoded) return;
  try {
    const { viewerId } = req.body || {};
    if (!viewerId) {
      return res.status(mapCodeToStatus('invalid-argument')).json({ error: 'viewerId is required' });
    }
    const ownerId = decoded.uid;
    const accessId = `${ownerId}_${viewerId}`;
    const accessRef = admin.firestore().collection('sharedAccess').doc(accessId);
    const doc = await accessRef.get();
    if (!doc.exists) {
      return res.json({ success: true, accessId, alreadyRevoked: true });
    }
    await accessRef.delete();
    return res.json({ success: true, accessId });
  } catch (error) {
    console.error('familyRevokeAccess error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /familyGetSharedAccess
const familyGetSharedAccess = onRequest({ region: 'us-central1', invoker: 'public' }, async (req, res) => {
  const decoded = await requireAuth(req, res);
  if (!decoded) return;
  try {
    const uid = decoded.uid;
    const db = admin.firestore();
    const { includeProfiles = true, includeOwner = false } = req.body || {};

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
        // If profiles are denormalized on the doc, include them directly
        viewer: val.viewer || undefined,
        owner: val.owner || undefined,
      };
    });

    if (!includeProfiles) {
      return res.json({ sharedAccess });
    }

    function toBrief(uid, data) {
      if (!data) return { uid, name: 'User', profileImageUrl: '' };
      const email = data.email || '';
      const emailLocal = email ? String(email).split('@')[0] : '';
      const name = data.name || data.displayName || emailLocal || 'User';
      const profileImageUrl = data.profileImageUrl || data.photoURL || '';
      return { uid, name, profileImageUrl };
    }

    const viewerIds = new Set(sharedAccess.filter(sa => !sa.viewer).map((sa) => sa.viewerId));
    const ownerIds = includeOwner ? new Set(sharedAccess.filter(sa => !sa.owner).map((sa) => sa.ownerId)) : new Set();
    const allIds = new Set([ ...viewerIds, ...ownerIds ]);

    const userSnaps = await Promise.all(
      Array.from(allIds).map(async (userId) => {
        try {
          const snap = await db.collection('users').doc(userId).get();
          return { userId, data: snap.exists ? snap.data() : null };
        } catch (e) {
          console.warn('Failed to read user profile for', userId, e);
          return { userId, data: null };
        }
      })
    );

    const profileMap = new Map(userSnaps.map(({ userId, data }) => [userId, data]));

    const sharedAccessWithProfiles = sharedAccess.map((sa) => {
      const base = { ...sa };
      if (!base.viewer) {
        const viewerData = profileMap.get(sa.viewerId) || null;
        base.viewer = toBrief(sa.viewerId, viewerData);
      }
      if (includeOwner && !base.owner) {
        const ownerData = profileMap.get(sa.ownerId) || null;
        base.owner = toBrief(sa.ownerId, ownerData);
      }
      return base;
    });

    return res.json({ sharedAccess: sharedAccessWithProfiles });
  } catch (error) {
    console.error('familyGetSharedAccess error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /familyGetInvitations
const familyGetInvitations = onRequest({ region: 'us-central1', invoker: 'public' }, async (req, res) => {
  const decoded = await requireAuth(req, res);
  if (!decoded) return;
  try {
    const uid = decoded.uid;
    const snap = await admin.firestore()
      .collection('invitations')
      .where('inviterId', '==', uid)
      .get();

    const invitations = snap.docs.map((d) => {
      const v = d.data();
      return {
        id: d.id,
        inviterId: v.inviterId,
        inviteeContact: v.inviteeContact,
        inviteeName: v.inviteeName || '',
        role: v.role,
        status: v.status,
        inviteCode: v.inviteCode,
        expiresAt: (v.expiresAt?.toDate?.().toISOString?.() || ''),
        scopes: Array.isArray(v.scopes) ? sanitizeScopes(v.scopes) : ['recaps:read'],
        createdAt: (v.createdAt?.toDate?.().toISOString?.() || ''),
        updatedAt: (v.updatedAt?.toDate?.().toISOString?.() || ''),
        inviteeUserId: v.inviteeUserId || undefined,
        acceptedAt: (v.acceptedAt?.toDate?.().toISOString?.() || undefined),
        acceptedProfile: v.acceptedProfile || undefined,
      };
    });

    return res.json({ invitations });
  } catch (error) {
    console.error('familyGetInvitations error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /familyGetAccountStatus
const familyGetAccountStatus = onRequest({ region: 'us-central1', invoker: 'public' }, async (req, res) => {
  const decoded = await requireAuth(req, res);
  if (!decoded) return;
  try {
    const uid = decoded.uid;
    const claimType = decoded?.accountType;
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

    return res.json({ accountType, sharedAccess });
  } catch (error) {
    console.error('familyGetAccountStatus error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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
