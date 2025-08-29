const { onRequest } = require('firebase-functions/v2/https');
const { admin } = require('../../firebaseAdmin');
const { generateUniqueReferralCode } = require('../../utils/referralCode');

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

// POST /redeemPromoCode
const redeemPromoCode = onRequest({ region: 'us-central1', invoker: 'public' }, async (req, res) => {
  const decoded = await requireAuth(req, res);
  if (!decoded) return;

  try {
    const data = req.body || {};
    const rawCode = String(data?.code || '').trim().toUpperCase();
    if (!rawCode || rawCode.length < 3) {
      return res.status(mapCodeToStatus('invalid-argument')).json({ error: 'A valid promo/referral code is required' });
    }

    const uid = decoded.uid;
    const db = admin.firestore();

    const redemptionId = `${uid}_${rawCode}`;
    const redemptionRef = db.collection('promoRedemptions').doc(redemptionId);

    const COMP_DAYS = Number(process.env.PROMO_COMP_DAYS || 30);
    const nowMs = Date.now();

    const result = await db.runTransaction(async (tx) => {
      const redemptionSnap = await tx.get(redemptionRef);
      if (redemptionSnap.exists) {
        throw { code: 'already-exists', message: 'This code was already redeemed' };
      }

      // 1) Try referral for this user
      const referralQuery = await db
        .collection('referrals')
        .where('referralCode', '==', rawCode)
        .where('status', '==', 'pending')
        .where('referredUserId', '==', uid)
        .limit(1)
        .get();

      let source = '';
      let referralDocRef = null;
      if (!referralQuery.empty) {
        source = 'referral';
        referralDocRef = referralQuery.docs[0].ref;
      }

      // 2) If not referral, try promoCodes (supports promo and gift card variants)
      let promoDocRef = null;
      let promoData = null;
      if (!source) {
        const promoQuery = await db
          .collection('promoCodes')
          .where('code', '==', rawCode)
          .limit(1)
          .get();
        if (!promoQuery.empty) {
          const promoDoc = promoQuery.docs[0];
          const promo = promoDoc.data() || {};
          const isActive = !!promo.isActive;
          const now = nowMs;
          const validFromMs = promo.validFrom?.toMillis?.() ?? (promo.validFrom ? new Date(promo.validFrom).getTime() : undefined);
          const validUntilMs = promo.validUntil?.toMillis?.() ?? (promo.validUntil ? new Date(promo.validUntil).getTime() : undefined);
          const withinWindow = (
            (validFromMs ? now >= validFromMs : true) &&
            (validUntilMs ? now <= validUntilMs : true)
          );
          const isGift = (promo.type === 'gift') || (promo.isGiftCard === true);
          if (isGift) {
            const alreadyRedeemed = !!promo.redeemedBy;
            if (alreadyRedeemed) {
              if (promo.redeemedBy === uid) {
                throw { code: 'already-exists', message: 'This code was already redeemed' };
              }
              throw { code: 'failed-precondition', message: 'Gift card already redeemed' };
            }
            if (isActive && withinWindow) {
              source = 'gift';
              promoDocRef = promoDoc.ref;
              promoData = promo;
            }
          } else {
            const maxUses = typeof promo.maxUses === 'number' ? promo.maxUses : undefined;
            const currentUses = typeof promo.currentUses === 'number' ? promo.currentUses : 0;
            const hasCapacity = (typeof maxUses === 'number') ? (currentUses < maxUses) : true;
            if (isActive && withinWindow && hasCapacity) {
              source = 'promo';
              promoDocRef = promoDoc.ref;
              promoData = promo;
            }
          }
        }
      }

      if (!source) {
        throw { code: 'failed-precondition', message: 'Invalid or expired code' };
      }

      // Determine effective comp days
      const userRef = db.collection('users').doc(uid);
      const nowTs = admin.firestore.Timestamp.now();
      const effectiveDays = (typeof promoData?.compDays === 'number' && promoData.compDays > 0)
        ? promoData.compDays
        : COMP_DAYS;
      const compUntilDate = new Date(nowMs + effectiveDays * 24 * 60 * 60 * 1000);
      const compUntilTs = admin.firestore.Timestamp.fromDate(compUntilDate);
      tx.set(userRef, {
        subscription: {
          plan: 'comp',
          status: 'trial',
          compUntil: compUntilTs,
          updatedAt: nowTs,
        },
        updatedAt: nowTs,
      }, { merge: true });

      if (source === 'referral' && referralDocRef) {
        tx.update(referralDocRef, {
          status: 'completed',
          completedAt: nowTs,
        });
      } else if (source === 'promo' && promoDocRef) {
        tx.update(promoDocRef, {
          currentUses: admin.firestore.FieldValue.increment(1),
          updatedAt: nowTs,
        });
      } else if (source === 'gift' && promoDocRef) {
        tx.update(promoDocRef, {
          redeemedBy: uid,
          redeemedAt: nowTs,
          updatedAt: nowTs,
        });
      }

      tx.set(redemptionRef, {
        uid,
        code: rawCode,
        source,
        compDays: effectiveDays,
        compUntil: compUntilTs,
        createdAt: nowTs,
      }, { merge: false });

      return { source, compUntil: compUntilDate.toISOString(), compDays: effectiveDays };
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('redeemPromoCode error:', error);
    const code = error?.code || 'internal';
    return res.status(mapCodeToStatus(code)).json({ error: error?.message || 'Internal Server Error' });
  }
});

// POST /generateReferralCode
const generateReferralCode = onRequest({ region: 'us-central1', invoker: 'public' }, async (req, res) => {
  const decoded = await requireAuth(req, res);
  if (!decoded) return;

  try {
    const uid = decoded.uid;
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? (userSnap.data() || {}) : {};

    if (userData.referralCode && typeof userData.referralCode === 'string' && userData.referralCode.trim().length >= 4) {
      return res.json({ referralCode: userData.referralCode });
    }

    const newCode = await generateUniqueReferralCode(6);
    const now = admin.firestore.FieldValue.serverTimestamp();
    await userRef.set({
      referralCode: newCode,
      referralStats: userData.referralStats || {
        totalReferrals: 0,
        successfulReferrals: 0,
        lastReferralDate: null,
      },
      updatedAt: now,
    }, { merge: true });

    return res.json({ referralCode: newCode });
  } catch (error) {
    console.error('generateReferralCode error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /processReferral
const processReferral = onRequest({ region: 'us-central1', invoker: 'public' }, async (req, res) => {
  const decoded = await requireAuth(req, res);
  if (!decoded) return;

  try {
    const data = req.body || {};
    const rawCode = String(data?.referralCode || data?.code || '').trim().toUpperCase();
    if (!rawCode || rawCode.length < 3) {
      return res.status(mapCodeToStatus('invalid-argument')).json({ error: 'A valid referral code is required' });
    }
    const uid = decoded.uid;
    const db = admin.firestore();
    const COMP_DAYS = Number(process.env.REFERRAL_COMP_DAYS || process.env.PROMO_COMP_DAYS || 30);
    const nowMs = Date.now();

    const redemptionId = `${uid}_${rawCode}`;
    const redemptionRef = db.collection('promoRedemptions').doc(redemptionId);

    const result = await db.runTransaction(async (tx) => {
      const redemptionSnap = await tx.get(redemptionRef);
      if (redemptionSnap.exists) {
        throw { code: 'already-exists', message: 'This code was already redeemed' };
      }

      const referrerSnap = await db
        .collection('users')
        .where('referralCode', '==', rawCode)
        .limit(1)
        .get();
      if (referrerSnap.empty) {
        throw { code: 'not-found', message: 'Invalid referral code' };
      }
      const referrerDoc = referrerSnap.docs[0];
      const referrerUserId = referrerDoc.id;
      if (referrerUserId === uid) {
        throw { code: 'failed-precondition', message: 'You cannot use your own referral code' };
      }

      const referralId = `${referrerUserId}_${uid}`;
      const referralRef = db.collection('referrals').doc(referralId);
      const existingReferral = await tx.get(referralRef);

      const nowTs = admin.firestore.Timestamp.now();
      const compUntilDate = new Date(nowMs + COMP_DAYS * 24 * 60 * 60 * 1000);
      const compUntilTs = admin.firestore.Timestamp.fromDate(compUntilDate);

      const userRef = db.collection('users').doc(uid);
      tx.set(userRef, {
        referredBy: rawCode,
        subscription: {
          plan: 'comp',
          status: 'trial',
          compUntil: compUntilTs,
          updatedAt: nowTs,
        },
        updatedAt: nowTs,
      }, { merge: true });

      if (existingReferral.exists) {
        tx.update(referralRef, {
          status: 'completed',
          referralCode: rawCode,
          completedAt: nowTs,
          updatedAt: nowTs,
        });
      } else {
        tx.set(referralRef, {
          referralId,
          referrerUserId,
          referredUserId: uid,
          referralCode: rawCode,
          status: 'completed',
          rewardType: 'extended_trial',
          rewardValue: { trialExtensionDays: COMP_DAYS },
          createdAt: nowTs,
          completedAt: nowTs,
          updatedAt: nowTs,
          metadata: { source: 'signup' },
        });
      }

      tx.set(referrerDoc.ref, {
        referralStats: {
          totalReferrals: admin.firestore.FieldValue.increment(1),
          successfulReferrals: admin.firestore.FieldValue.increment(1),
          lastReferralDate: nowTs,
        },
        updatedAt: nowTs,
      }, { merge: true });

      tx.set(redemptionRef, {
        uid,
        code: rawCode,
        source: 'referral-signup',
        compDays: COMP_DAYS,
        compUntil: compUntilTs,
        createdAt: nowTs,
      });

      return { referrerUserId, compUntil: compUntilDate.toISOString(), compDays: COMP_DAYS };
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('processReferral error:', error);
    const code = error?.code || 'internal';
    return res.status(mapCodeToStatus(code)).json({ error: error?.message || 'Internal Server Error' });
  }
});

// POST /getReferralStats
const getReferralStats = onRequest({ region: 'us-central1', invoker: 'public' }, async (req, res) => {
  const decoded = await requireAuth(req, res);
  if (!decoded) return;

  try {
    const uid = decoded.uid;
    const db = admin.firestore();
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      return res.status(mapCodeToStatus('not-found')).json({ error: 'User not found' });
    }
    const user = userSnap.data() || {};

    const recentSnap = await db
      .collection('referrals')
      .where('referrerUserId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    const recentReferrals = recentSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return res.json({
      referralCode: user.referralCode || null,
      referralStats: user.referralStats || { totalReferrals: 0, successfulReferrals: 0, lastReferralDate: null },
      recentReferrals,
    });
  } catch (error) {
    console.error('getReferralStats error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = {
  redeemPromoCode,
  generateReferralCode,
  processReferral,
  getReferralStats,
};
