// Load environment variables
require('dotenv').config({ path: __dirname + '/.env' });

// Log environment loading for debugging
console.log('Loading environment variables...');
console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
console.log('PROJECT_ID present:', !!process.env.PROJECT_ID);

const functions = require("firebase-functions");
const { onRequest } = require('firebase-functions/v2/https');
const { admin } = require('./firebaseAdmin');
const { validateEnvironment } = require('./utils/environmentValidator');
const { generateUniqueInviteCode } = require('./utils/inviteCode');

// Validate environment variables with better error handling
try {
  console.log('Validating environment variables...');
  validateEnvironment();
  console.log(' Environment variables validated successfully');
} catch (error) {
  console.error(' Environment validation failed:', error.message);
  // Log which variables are missing
  const requiredVars = ['PROJECT_ID', 'OPENAI_API_KEY'];
  requiredVars.forEach(varName => {
    console.log(`${varName}: ${process.env[varName] ? ' Present' : ' Missing'}`);
  });
  // Don't throw error to allow emulator to start for debugging
}

// --- Automated Recap Functions ---
const { AutomatedRecapService } = require('./services/recapGenerator');

// --- Journal Entry Trigger ---
const { onJournalEntryCreated } = require('./functions/onJournalEntry');

// Export the journal entry trigger
exports.onJournalEntryCreated = onJournalEntryCreated;

// generateRecapsForAllUsers function was removed

// Initialize services
const recapService = new AutomatedRecapService();

// Manual trigger functions for testing
exports.generateWeeklyRecap = onRequest(
  { region: 'us-central1', invoker: 'private', secrets: ['OPENAI_API_KEY'] },
  async (req, res) => {
  try {
    console.log('Admin SDK project (runtime):', admin.app().options.projectId);
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer (.+)$/i);
    if (!match) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const idToken = match[1];
    let decoded;
    try { decoded = await admin.auth().verifyIdToken(idToken); } catch {
      return res.status(401).json({ error: 'Invalid ID token' });
    }

    const { userId: bodyUserId, childId, startDate, endDate } = req.body || {};
    const userId = bodyUserId || decoded.uid;
    const weekRange = { start: new Date(startDate), end: new Date(endDate) };
    const result = await recapService.generateWeeklyRecap(userId, childId, weekRange);
    return res.json(result);
  } catch (err) {
    console.error('generateWeeklyRecap error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

exports.generateMonthlyRecap = onRequest(
  { region: 'us-central1', invoker: 'private', secrets: ['OPENAI_API_KEY'] },
  async (req, res) => {
  try {
    console.log('Admin SDK project (runtime):', admin.app().options.projectId);
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer (.+)$/i);
    if (!match) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const idToken = match[1];
    let decoded;
    try { decoded = await admin.auth().verifyIdToken(idToken); } catch {
      return res.status(401).json({ error: 'Invalid ID token' });
    }

    const { userId: bodyUserId, childId, startDate, endDate } = req.body || {};
    const userId = bodyUserId || decoded.uid;
    const monthRange = { start: new Date(startDate), end: new Date(endDate) };
    const result = await recapService.generateMonthlyRecap(userId, childId, monthRange);
    return res.json(result);
  } catch (err) {
    console.error('generateMonthlyRecap error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

exports.generateYearlyRecap = onRequest(
  { region: 'us-central1', invoker: 'private', secrets: ['OPENAI_API_KEY'] },
  async (req, res) => {
  try {
    console.log('Admin SDK project (runtime):', admin.app().options.projectId);
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer (.+)$/i);
    if (!match) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const idToken = match[1];
    let decoded;
    try { decoded = await admin.auth().verifyIdToken(idToken); } catch {
      return res.status(401).json({ error: 'Invalid ID token' });
    }

    const { userId: bodyUserId, childId, startDate, endDate } = req.body || {};
    const userId = bodyUserId || decoded.uid;
    const yearRange = { start: new Date(startDate), end: new Date(endDate) };
    const result = await recapService.generateYearlyRecap(userId, childId, yearRange);
    return res.json(result);
  } catch (err) {
    console.error('generateYearlyRecap error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Scheduled function for monthly recaps
exports.scheduledMonthlyRecaps = functions.pubsub.schedule('0 9 1 * *')
  .timeZone(process.env.DEFAULT_TIMEZONE || 'America/New_York')
  .onRun(async (context) => {
    console.log('Running scheduled monthly recaps...');
    console.log('Admin SDK project (runtime):', admin.app().options.projectId);
    const recapService = new AutomatedRecapService();
    return await recapService.generateAllMonthlyRecaps();
  });

// Scheduled function for weekly recaps
exports.scheduledWeeklyRecaps = functions.pubsub.schedule('0 9 * * 1')
  .timeZone(process.env.DEFAULT_TIMEZONE || 'America/New_York')
  .onRun(async (context) => {
    console.log('Running scheduled weekly recaps...');
    console.log('Admin SDK project (runtime):', admin.app().options.projectId);
    const recapService = new AutomatedRecapService();
    return await recapService.generateAllWeeklyRecaps();
  });

// Scheduled function for yearly recaps
exports.scheduledYearlyRecaps = functions.pubsub.schedule('0 9 1 1 *')
  .timeZone(process.env.DEFAULT_TIMEZONE || 'America/New_York')
  .onRun(async (context) => {
    console.log('Running scheduled yearly recaps...');
    console.log('Admin SDK project (runtime):', admin.app().options.projectId);
    const recapService = new AutomatedRecapService();
    return await recapService.generateAllYearlyRecaps();
  });

// --- Test Functions ---

/**
 * A test function to send a push notification to a specific device token.
 */
exports.sendTestNotification = onRequest(
  { region: 'us-central1', invoker: 'private', environmentVariables: {} },
  async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer (.+)$/i);
    if (!match) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    try { await admin.auth().verifyIdToken(match[1]); } catch {
      return res.status(401).json({ error: 'Invalid ID token' });
    }

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
});

// --- Test Recap Function for All Users ---
const { generateAllUsersTestRecaps } = require('./functions/testRecaps');
exports.generateAllUsersTestRecaps = generateAllUsersTestRecaps;

// --- Recap Interactions (Comments & Likes) ---
const { onRecapCommentCreated, onRecapLikesUpdated } = require('./functions/onRecapInteraction');
exports.onRecapCommentCreated = onRecapCommentCreated;
exports.onRecapLikesUpdated = onRecapLikesUpdated;


// --- Notification Device Token Management ---
const { NotificationService } = require('./services/notificationService');
const { sendDailyReminders, sendWeeklyReminders, sendMonthlyReminders } = require('./scheduled/reminders');

/**
 * Registers a device token for the authenticated user to receive push notifications.
 * Expects { token: string, platform: string } in the data payload.
 */
exports.registerDeviceToken = onRequest(
  { region: 'us-central1', invoker: 'private', environmentVariables: {} },
  async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer (.+)$/i);
    if (!match) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    let decoded;
    try { decoded = await admin.auth().verifyIdToken(match[1]); } catch {
      return res.status(401).json({ error: 'Invalid ID token' });
    }

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
});

/**
 * Removes a device token for the authenticated user, stopping push notifications to that device.
 * Expects { token: string } in the data payload.
 */
exports.removeDeviceToken = onRequest(
  { region: 'us-central1', invoker: 'private', environmentVariables: {} },
  async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer (.+)$/i);
    if (!match) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    let decoded;
    try { decoded = await admin.auth().verifyIdToken(match[1]); } catch {
      return res.status(401).json({ error: 'Invalid ID token' });
    }

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
});


// --- Scheduled Functions ---

/**
 * A scheduled function that runs every day at 9:00 AM to send daily reminders.
 */
exports.dailyReminderScheduler = functions.pubsub
  .schedule('every day 09:00')
  .timeZone(process.env.DEFAULT_TIMEZONE || 'America/New_York')
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
  .timeZone(process.env.DEFAULT_TIMEZONE || 'America/New_York')
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
  .timeZone(process.env.DEFAULT_TIMEZONE || 'America/New_York')
  .onRun(async (context) => {
    try {
      await sendMonthlyReminders();
      return null;
    } catch (error) {
      console.error('Error running monthly reminder scheduler:', error);
      return null;
    }
  });

// --- Test Connection Function ---
const { testConnection } = require('./functions/testConnection');
exports.testConnection = testConnection;

// --- Family Sharing Cloud Functions ---
const ALLOWED_SCOPES = ['recaps:read', 'journal:read', 'comments:write', 'likes:write'];

function sanitizeScopes(requested) {
  const arr = Array.isArray(requested) ? requested : [];
  const filtered = [...new Set(arr.filter(s => ALLOWED_SCOPES.includes(s)))];
  return filtered.length ? filtered : ['recaps:read'];
}

// Create a family invitation with secure unique invite code (callable)
exports['family-createInvitation'] = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    }
    const inviteeContact = String(data?.inviteeContact || '');
    if (!inviteeContact) {
      throw new functions.https.HttpsError('invalid-argument', 'inviteeContact is required');
    }
    const requestedScopes = Array.isArray(data?.scopes) ? data.scopes : [];
    const scopes = sanitizeScopes(requestedScopes);
    const inviterId = context.auth.uid;

    const inviteCode = await generateUniqueInviteCode(6);
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    const invitation = {
      inviterId,
      inviteeContact: inviteeContact.trim(),
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
    console.error('family-createInvitation error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Internal Server Error');
  }
});

// Accept an invitation by invite code and create shared access (callable)
exports['family-acceptInvitation'] = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    }
    const inviteCode = String(data?.inviteCode || '').trim().toUpperCase();
    if (!inviteCode || inviteCode.length < 6) {
      throw new functions.https.HttpsError('invalid-argument', 'A valid inviteCode is required');
    }

    const inviteSnap = await admin.firestore()
      .collection('invitations')
      .where('inviteCode', '==', inviteCode)
      .limit(1)
      .get();

    if (inviteSnap.empty) {
      throw new functions.https.HttpsError('not-found', 'Invitation not found');
    }

    const inviteDoc = inviteSnap.docs[0];
    const invite = inviteDoc.data();
    if (invite.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Invitation is not pending');
    }
    if (invite.expiresAt && invite.expiresAt.toMillis && invite.expiresAt.toMillis() < Date.now()) {
      throw new functions.https.HttpsError('failed-precondition', 'Invitation has expired');
    }

    const ownerId = invite.inviterId;
    const viewerId = context.auth.uid;

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

    // Ensure viewer has correct custom claims and a minimal user document
    try {
      // 1) Set custom claim for view-only account type (idempotent)
      const userRecord = await admin.auth().getUser(viewerId);
      const existingClaims = userRecord.customClaims || {};
      if (existingClaims.accountType !== 'view-only') {
        await admin.auth().setCustomUserClaims(viewerId, { ...existingClaims, accountType: 'view-only' });
      }

      // 2) Upsert a minimal users/{viewerId} document so client can update profile without strict create rules
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
          // Family sharing specific fields
          accountType: 'view-only',
          parentUserId: ownerId,
          profileComplete: false,
        }, { merge: true });
      } else {
        await userRef.set({
          updatedAt: now,
          accountType: 'view-only',
          parentUserId: ownerId,
          // Do not overwrite existing profile fields; just ensure flags exist
          profileComplete: (userSnap.data()?.profileComplete === true) ? true : false,
        }, { merge: true });
      }
    } catch (claimErr) {
      console.error('Error setting viewer claims or user doc:', claimErr);
      // Continue; not fatal for accepting invitation
    }

    // Notify inviter that invitation was accepted
    try {
      const notificationService = new NotificationService();
      await notificationService.sendFamilyInvitationAcceptedNotification(ownerId, viewerId);
    } catch (notifyErr) {
      console.error('Notification error (family invitation accepted):', notifyErr);
    }

    return { success: true, ownerId, viewerId, accessId, scopes };
  } catch (error) {
    console.error('family-acceptInvitation error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Internal Server Error');
  }
});

// Update viewer permissions (scopes) for an existing shared access (callable)
exports['family-updatePermissions'] = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    }
    const viewerId = String(data?.viewerId || '');
    if (!viewerId) {
      throw new functions.https.HttpsError('invalid-argument', 'viewerId is required');
    }
    const requestedScopes = Array.isArray(data?.scopes) ? data.scopes : [];
    const scopes = sanitizeScopes(requestedScopes);
    const ownerId = context.auth.uid;
    const accessId = `${ownerId}_${viewerId}`;
    const accessRef = admin.firestore().collection('sharedAccess').doc(accessId);
    const doc = await accessRef.get();
    if (!doc.exists) {
      throw new functions.https.HttpsError('not-found', 'Shared access not found');
    }

    await accessRef.update({ scopes, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return { success: true, accessId, scopes };
  } catch (error) {
    console.error('family-updatePermissions error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Internal Server Error');
  }
});

// Revoke a viewer's access by deleting the shared access document (callable)
exports['family-revokeAccess'] = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    }
    const viewerId = String(data?.viewerId || '');
    if (!viewerId) {
      throw new functions.https.HttpsError('invalid-argument', 'viewerId is required');
    }
    const ownerId = context.auth.uid;
    const accessId = `${ownerId}_${viewerId}`;
    const accessRef = admin.firestore().collection('sharedAccess').doc(accessId);
    const doc = await accessRef.get();
    if (!doc.exists) {
      return { success: true, accessId, alreadyRevoked: true };
    }
    await accessRef.delete();
    return { success: true, accessId };
  } catch (error) {
    console.error('family-revokeAccess error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Internal Server Error');
  }
});

// Get shared access for current user (owner or viewer) (callable)
exports['family-getSharedAccess'] = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    }
    const uid = context.auth.uid;
    const db = admin.firestore();
    // Removed undefined accountType fallback. This endpoint only returns sharedAccess.

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
    console.error('family-getSharedAccess error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Internal Server Error');
  }
});

// Get invitations for current owner (callable)
exports['family-getInvitations'] = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    }
    const uid = context.auth.uid;
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
    console.error('family-getInvitations error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Internal Server Error');
  }
});

// Get account status (accountType from custom claims + sharedAccess list) (callable)
exports['family-getAccountStatus'] = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
    }
    const uid = context.auth.uid;
    // Read accountType from custom claims; default to 'full' but fallback to Firestore if missing
    const claimType = context.auth.token?.accountType;
    let accountType = claimType === 'view-only' ? 'view-only' : 'full';

    const db = admin.firestore();
    const [asOwnerSnap, asViewerSnap] = await Promise.all([
      db.collection('sharedAccess').where('ownerId', '==', uid).get(),
      db.collection('sharedAccess').where('viewerId', '==', uid).get(),
    ]);

    // Firestore fallbacks for accountType (handles stale tokens right after invite acceptance)
    if (accountType !== 'view-only') {
      try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists && userDoc.data()?.accountType === 'view-only') {
          accountType = 'view-only';
        }
      } catch (e) {
        console.warn('Could not read users doc for accountType fallback:', e);
      }

      // Infer from sharedAccess shape: viewer entries present but no owner entries => view-only
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
    console.error('family-getAccountStatus error:', error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', 'Internal Server Error');
  }
});
