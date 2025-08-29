const { onRequest } = require('firebase-functions/v2/https');
const crypto = require('crypto');
const { admin } = require('../firebaseAdmin');

/**
 * RevenueCat Webhook (v2-compatible scaffold)
 * - Auth: requires Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>
 * - Idempotent processing via event-id header or body hash
 * - Persists raw event for audit in `revenuecatEvents/{id}`
 * - Updates `users/{uid}.subscription` (server-only) with normalized status
 */
exports.revenuecatWebhook = onRequest(
  { region: 'us-central1', invoker: 'public', secrets: ['REVENUECAT_WEBHOOK_SECRET'] },
  async (req, res) => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
      }

      // Secret resolution:
      // - In production: injected from Secret Manager as REVENUECAT_WEBHOOK_SECRET
      // - In local emulators: allow fallback to LOCAL_REVENUECAT_WEBHOOK_SECRET to avoid deploy conflicts
      const isEmulator =
        process.env.FUNCTIONS_EMULATOR === 'true' ||
        !!process.env.FIRESTORE_EMULATOR_HOST ||
        !!process.env.AUTH_EMULATOR_HOST ||
        !!process.env.STORAGE_EMULATOR_HOST;
      const secret =
        process.env.REVENUECAT_WEBHOOK_SECRET ||
        (isEmulator ? process.env.LOCAL_REVENUECAT_WEBHOOK_SECRET : undefined);
      if (!secret) {
        console.error('RevenueCat webhook secret not configured');
        return res.status(500).json({ error: 'Server misconfiguration' });
      }

      // 1) Verify Authorization header (Bearer <secret>)
      const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
      const authHeader = (req.headers['authorization'] || '').toString();
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (!match) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
      }
      const provided = match[1].trim();
      const ok = timingSafeEqual(Buffer.from(secret), Buffer.from(provided));
      if (!ok) {
        return res.status(401).json({ error: 'Invalid Authorization token' });
      }

      // 2) Parse event and build idempotency key
      const payload = safeParseJSON(rawBody) || req.body || {};
      const eventId = (
        req.headers['x-event-id'] ||
        req.headers['x-revenuecat-event-id'] ||
        payload?.event?.id ||
        payload?.id ||
        sha256(rawBody)
      );

      const db = admin.firestore();
      const eventsCol = db.collection('revenuecatEvents');
      const eventRef = eventsCol.doc(String(eventId));

      // 3) Idempotency check
      const existing = await eventRef.get();
      if (existing.exists) {
        return res.status(200).json({ ok: true, idempotent: true });
      }

      // 4) Persist raw payload for audit/debug
      const now = admin.firestore.FieldValue.serverTimestamp();
      await eventRef.set({
        receivedAt: now,
        headers: redactHeaders(req.headers),
        payload,
      });

      // 5) Attempt to update user subscription snapshot
      const uid = String(
        payload?.event?.app_user_id ||
        payload?.app_user_id ||
        payload?.subscriber?.app_user_id ||
        ''
      ).trim();

      if (!uid) {
        console.warn('No app_user_id found in payload; stored event only.');
        return res.status(200).json({ ok: true, stored: true, note: 'missing app_user_id' });
      }

      const { status, productId, platform, willRenew, expirationDate, originalPurchaseDate, isSandbox } =
        normalizeRevenueCatStatus(payload);

      const userRef = db.collection('users').doc(uid);
      await userRef.set({
        subscription: {
          status, // 'active' | 'trial' | 'inactive' | 'cancelled'
          plan: productId || 'unknown',
          productId: productId || null,
          platform: platform || null,
          willRenew: willRenew ?? null,
          expirationDate: expirationDate ? admin.firestore.Timestamp.fromDate(new Date(expirationDate)) : null,
          originalPurchaseDate: originalPurchaseDate ? admin.firestore.Timestamp.fromDate(new Date(originalPurchaseDate)) : null,
          isSandbox: !!isSandbox,
          updatedAt: now,
        },
        updatedAt: now,
      }, { merge: true });

      // Mark processed
      await eventRef.set({ processedAt: now, processedForUid: uid }, { merge: true });

      return res.status(200).json({ ok: true, processed: true });
    } catch (err) {
      console.error('revenuecatWebhook error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function safeParseJSON(buf) {
  try {
    return JSON.parse(Buffer.isBuffer(buf) ? buf.toString('utf8') : String(buf || ''));
  } catch {
    return null;
  }
}

function redactHeaders(headers) {
  const h = { ...headers };
  if (h['x-revenuecat-signature']) h['x-revenuecat-signature'] = '[redacted]';
  if (h['x-webhook-signature']) h['x-webhook-signature'] = '[redacted]';
  if (h['x-signature']) h['x-signature'] = '[redacted]';
  if (h['authorization']) h['authorization'] = '[redacted]';
  return h;
}

function normalizeRevenueCatStatus(payload) {
  // Tries to infer subscription state from common RevenueCat webhook shapes
  // Fallbacks keep fields null-safe and conservative
  const ev = payload?.event || payload || {};
  const entitlements = ev.entitlements || payload?.subscriber?.entitlements || {};

  // Try to find any active entitlement
  let active = false;
  let trial = false;
  let productId = ev.product_id || ev.productId || null;
  let expirationDate = ev.expiration_at || ev.expires_at || ev.expiration || null;
  let originalPurchaseDate = ev.purchased_at || ev.original_purchase_date || null;
  let willRenew = ev.will_renew ?? ev.auto_renew_status ?? null;
  let platform = ev.store || ev.platform || null; // e.g., APP_STORE, PLAY_STORE
  let isSandbox = (ev.environment || payload?.environment || '').toString().toUpperCase() === 'SANDBOX';

  // Inspect entitlements map for active state and details
  for (const key of Object.keys(entitlements || {})) {
    const e = entitlements[key] || {};
    const eActive = e.active === true ||
      (e.expires_date ? new Date(e.expires_date).getTime() > Date.now() : false);
    if (eActive) {
      active = true;
      productId = productId || e.product_identifier || e.productId || null;
      expirationDate = expirationDate || e.expires_date || null;
      originalPurchaseDate = originalPurchaseDate || e.purchase_date || null;
      trial = trial || e.is_trial === true || e.period_type === 'trial';
    }
  }

  // Map to normalized status
  let status = 'inactive';
  if (active && trial) status = 'trial';
  else if (active) status = 'active';
  else if (ev.type && String(ev.type).toUpperCase().includes('CANCEL')) status = 'cancelled';
  else if (ev.type && String(ev.type).toUpperCase().includes('EXPIRE')) status = 'inactive';

  return { status, productId, platform, willRenew, expirationDate, originalPurchaseDate, isSandbox };
}
