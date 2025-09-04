const { onRequest } = require('firebase-functions/v2/https');
const { admin } = require('../../firebaseAdmin');

// Helper: map logical error codes to HTTP status
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

async function isAdminDecoded(decoded) {
  if (!decoded) return false;
  if (decoded.admin === true) return true;
  try {
    const snap = await admin.firestore().collection('users').doc(decoded.uid).get();
    const data = snap.exists ? snap.data() : null;
    return !!(data && (data.role === 'admin' || data.isAdmin === true));
  } catch (e) {
    console.error('isAdminDecoded check failed:', e);
    return false;
  }
}

// POST: adminSetAdminRole
// Body: { targetUid: string, makeAdmin: boolean }
const adminSetAdminRole = onRequest({ region: 'us-central1', invoker: 'public' }, async (req, res) => {
  const decoded = await requireAuth(req, res);
  if (!decoded) return;
  try {
    if (!(await isAdminDecoded(decoded))) {
      return res.status(mapCodeToStatus('permission-denied')).json({ error: 'Admin privileges required' });
    }
    const body = req.body || {};
    const targetUid = String(body.targetUid || '').trim();
    const makeAdmin = body.makeAdmin === true;
    if (!targetUid) {
      return res.status(mapCodeToStatus('invalid-argument')).json({ error: 'targetUid is required' });
    }

    // Update custom claims
    await admin.auth().setCustomUserClaims(targetUid, makeAdmin ? { admin: true } : { admin: null });

    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    // Mirror role in Firestore user doc
    const userRef = db.collection('users').doc(targetUid);
    await userRef.set(
      makeAdmin
        ? { role: 'admin', isAdmin: true, updatedAt: now }
        : { role: admin.firestore.FieldValue.delete(), isAdmin: false, updatedAt: now },
      { merge: true }
    );

    // Audit log
    await db.collection('admin_audit_logs').add({
      action: 'setAdminRole',
      actorUid: decoded.uid,
      targetUid,
      payload: { makeAdmin },
      createdAt: now,
    });

    return res.json({ success: true, targetUid, admin: makeAdmin });
  } catch (error) {
    console.error('adminSetAdminRole error:', error);
    const code = error?.code || 'internal';
    return res.status(mapCodeToStatus(code)).json({ error: error?.message || 'Internal Server Error' });
  }
});

// POST: adminCreatePromoCode
// Body: { code?: string, type?: 'promo'|'gift', compDays?: number, maxUses?: number, validFrom?: string, validUntil?: string, isActive?: boolean }
const adminCreatePromoCode = onRequest({ region: 'us-central1', invoker: 'public' }, async (req, res) => {
  const decoded = await requireAuth(req, res);
  if (!decoded) return;
  try {
    if (!(await isAdminDecoded(decoded))) {
      return res.status(mapCodeToStatus('permission-denied')).json({ error: 'Admin privileges required' });
    }
    const db = admin.firestore();
    const body = req.body || {};

    const inCode = (body.code || '').toString().trim();
    const code = inCode ? inCode.toUpperCase() : undefined;
    const type = (body.type === 'gift' ? 'gift' : 'promo');
    const compDays = Number.isFinite(body.compDays) ? Number(body.compDays) : 30;
    const maxUses = body.maxUses != null ? Number(body.maxUses) : null;
    const isActive = body.isActive === false ? false : true;

    const validFrom = body.validFrom ? new Date(body.validFrom) : null;
    const validUntil = body.validUntil ? new Date(body.validUntil) : null;
    if (validFrom && isNaN(validFrom.getTime())) {
      return res.status(mapCodeToStatus('invalid-argument')).json({ error: 'validFrom must be ISO date string' });
    }
    if (validUntil && isNaN(validUntil.getTime())) {
      return res.status(mapCodeToStatus('invalid-argument')).json({ error: 'validUntil must be ISO date string' });
    }

    const now = admin.firestore.Timestamp.now();

    const result = await db.runTransaction(async (tx) => {
      let docRef;
      if (code) {
        docRef = db.collection('promoCodes').doc(code);
        const existing = await tx.get(docRef);
        if (existing.exists) {
          throw { code: 'already-exists', message: 'Code already exists' };
        }
      } else {
        docRef = db.collection('promoCodes').doc();
      }

      const payload = {
        code: code || docRef.id.toUpperCase(),
        type,
        compDays,
        isActive,
        createdAt: now,
        updatedAt: now,
      };

      if (maxUses != null && Number.isFinite(maxUses)) payload.maxUses = Number(maxUses);
      if (validFrom) payload.validFrom = admin.firestore.Timestamp.fromDate(validFrom);
      if (validUntil) payload.validUntil = admin.firestore.Timestamp.fromDate(validUntil);
      if (type === 'gift') payload.isGiftCard = true;

      tx.set(docRef, payload, { merge: false });

      // Audit
      tx.set(db.collection('admin_audit_logs').doc(), {
        action: 'createPromoCode',
        actorUid: decoded.uid,
        targetCode: payload.code,
        payload: { ...payload, createdAt: undefined, updatedAt: undefined },
        createdAt: now,
      });

      return { id: docRef.id, code: payload.code };
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('adminCreatePromoCode error:', error);
    const code = error?.code || 'internal';
    return res.status(mapCodeToStatus(code)).json({ error: error?.message || 'Internal Server Error' });
  }
});

// POST: adminDisablePromoCode
// Body: { code: string }
const adminDisablePromoCode = onRequest({ region: 'us-central1', invoker: 'public' }, async (req, res) => {
  const decoded = await requireAuth(req, res);
  if (!decoded) return;
  try {
    if (!(await isAdminDecoded(decoded))) {
      return res.status(mapCodeToStatus('permission-denied')).json({ error: 'Admin privileges required' });
    }
    const db = admin.firestore();
    const body = req.body || {};
    const raw = (body.code || '').toString().trim().toUpperCase();
    if (!raw) {
      return res.status(mapCodeToStatus('invalid-argument')).json({ error: 'code is required' });
    }

    const now = admin.firestore.Timestamp.now();

    const result = await db.runTransaction(async (tx) => {
      // We allow either id=code or field code==raw
      let docRef = db.collection('promoCodes').doc(raw);
      let snap = await tx.get(docRef);
      if (!snap.exists) {
        const query = await db.collection('promoCodes').where('code', '==', raw).limit(1).get();
        if (!query.empty) {
          docRef = query.docs[0].ref;
          snap = query.docs[0];
        }
      }
      if (!snap.exists) {
        throw { code: 'not-found', message: 'Promo code not found' };
      }

      tx.update(docRef, { isActive: false, updatedAt: now });

      // Audit
      tx.set(db.collection('admin_audit_logs').doc(), {
        action: 'disablePromoCode',
        actorUid: decoded.uid,
        targetCode: raw,
        createdAt: now,
      });

      return { code: raw };
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('adminDisablePromoCode error:', error);
    const code = error?.code || 'internal';
    return res.status(mapCodeToStatus(code)).json({ error: error?.message || 'Internal Server Error' });
  }
});

module.exports = {
  adminSetAdminRole,
  adminCreatePromoCode,
  adminDisablePromoCode,
};

// POST: adminModerationAction
// Body: { reportId: string, action: 'approve'|'remove'|'ban-user'|'mark-reviewed'|'mark-resolved', notes?: string }
const adminModerationAction = onRequest({ region: 'us-central1', invoker: 'public' }, async (req, res) => {
  const decoded = await requireAuth(req, res);
  if (!decoded) return;
  try {
    if (!(await isAdminDecoded(decoded))) {
      return res.status(mapCodeToStatus('permission-denied')).json({ error: 'Admin privileges required' });
    }
    const db = admin.firestore();
    const body = req.body || {};
    const reportId = (body.reportId || '').toString().trim();
    const action = (body.action || '').toString();
    const notes = (body.notes || '').toString();
    const allowed = new Set(['approve', 'remove', 'ban-user', 'mark-reviewed', 'mark-resolved']);
    if (!reportId) {
      return res.status(mapCodeToStatus('invalid-argument')).json({ error: 'reportId is required' });
    }
    if (!allowed.has(action)) {
      return res.status(mapCodeToStatus('invalid-argument')).json({ error: 'invalid action' });
    }

    const now = admin.firestore.Timestamp.now();

    const result = await db.runTransaction(async (tx) => {
      const reportRef = db.collection('reports').doc(reportId);
      const reportSnap = await tx.get(reportRef);
      if (!reportSnap.exists) {
        throw { code: 'not-found', message: 'Report not found' };
      }
      const report = reportSnap.data() || {};

      const updates = { updatedAt: now, lastAction: action, moderatedBy: decoded.uid };
      let statusUpdate = {};
      if (action === 'approve') {
        statusUpdate = { status: 'resolved', resolution: 'approved' };
      } else if (action === 'remove') {
        statusUpdate = { status: 'resolved', resolution: 'removed' };
        // NOTE: Implement content removal here if content references are well-defined.
      } else if (action === 'mark-reviewed') {
        statusUpdate = { status: 'reviewed' };
      } else if (action === 'mark-resolved') {
        statusUpdate = { status: 'resolved' };
      }

      if (notes) {
        updates.moderatorNotes = admin.firestore.FieldValue.arrayUnion({ text: notes, at: now, by: decoded.uid });
      }

      tx.set(reportRef, { ...updates, ...statusUpdate }, { merge: true });

      if (action === 'ban-user' && report.reportedUserId) {
        const userRef = db.collection('users').doc(report.reportedUserId);
        tx.set(userRef, { banned: true, updatedAt: now }, { merge: true });
      }

      tx.set(db.collection('admin_audit_logs').doc(), {
        action: 'moderationAction',
        actorUid: decoded.uid,
        targetReportId: reportId,
        payload: { action, notes: notes || undefined },
        createdAt: now,
      });

      return { reportId, action };
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('adminModerationAction error:', error);
    const code = error?.code || 'internal';
    return res.status(mapCodeToStatus(code)).json({ error: error?.message || 'Internal Server Error' });
  }
});

// Export appended at end to ensure declaration exists
module.exports.adminModerationAction = adminModerationAction;
