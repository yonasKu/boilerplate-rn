# Email Delivery Setup (Invitations, Referrals, Gift Cards)

This guide shows how to send transactional emails from Firebase Cloud Functions for:
- Family invitations (send invite code to email entered by user)
- Referrals
- Gift cards

It uses SendGrid for simplicity and reliability.

---

## 1) Prerequisites

- Firebase Functions Node runtime: 20 (already configured in `functions/package.json`)
- SendGrid account + API key
- Verified sender or domain in SendGrid

---

## 2) Environment Variables

Add these to `functions/.env` (local) and to production via Firebase env config or secret manager.

```
# SendGrid
SENDGRID_API_KEY=SG.xxxxx
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=SproutBook

# Optional Template IDs (recommended)
INVITE_TEMPLATE_ID=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REFERRAL_TEMPLATE_ID=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GIFTCARD_TEMPLATE_ID=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# App links used in emails
APP_STORE_URL=https://apps.apple.com/app/idXXXXXXXXX
PLAY_STORE_URL=https://play.google.com/store/apps/details?id=your.app
WEB_ACCEPT_INVITE_URL=https://yourapp.com/accept-invite  # e.g. your web deep-link landing
```

Note: `.env.example` already hints at SendGrid keys. Fill in real values in `.env` and NEVER commit `.env`.

---

## 3) Install dependency

From the `functions/` directory:

```bash
npm i @sendgrid/mail
```

Or with the emulator root scripts:

```bash
cd functions && npm i @sendgrid/mail
```

---

## 4) Create a minimal email service

Create `functions/services/emailService.js`:

```js
// functions/services/emailService.js
const sgMail = require('@sendgrid/mail');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourdomain.com';
const FROM_NAME = process.env.FROM_NAME || 'SproutBook';

let initialized = false;
function ensureInit() {
  if (!initialized) {
    if (!SENDGRID_API_KEY) throw new Error('Missing SENDGRID_API_KEY');
    sgMail.setApiKey(SENDGRID_API_KEY);
    initialized = true;
  }
}

async function sendBasicEmail(to, subject, html) {
  ensureInit();
  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    html,
  };
  return sgMail.send(msg);
}

async function sendTemplateEmail(to, templateId, dynamicTemplateData) {
  ensureInit();
  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    templateId,
    dynamicTemplateData,
  };
  return sgMail.send(msg);
}

module.exports = {
  sendBasicEmail,
  sendTemplateEmail,
};
```

---

## 5) Family Invitations: send email when creating the invite

The callable `family-createInvitation` lives in `functions/index.js`. After creating the invitation and invite code, send the email.

Add near the top:

```js
const { sendBasicEmail, sendTemplateEmail } = require('./services/emailService');
```

Inside `family-createInvitation` AFTER the Firestore write returns, add:

```js
// c:\Users\HP\CascadeProjects\SproutBook\functions\index.js
// ...inside family-createInvitation
const isEmail = /@/.test(inviteeContact);
if (isEmail) {
  try {
    const appLinks = {
      ios: process.env.APP_STORE_URL,
      android: process.env.PLAY_STORE_URL,
      webAccept: process.env.WEB_ACCEPT_INVITE_URL,
    };

    if (process.env.INVITE_TEMPLATE_ID) {
      await sendTemplateEmail(inviteeContact, process.env.INVITE_TEMPLATE_ID, {
        invite_code: inviteCode,
        inviter_name: context.auth?.token?.name || 'A family member',
        ios_link: appLinks.ios,
        android_link: appLinks.android,
        accept_link: `${appLinks.webAccept}?code=${inviteCode}`,
      });
    } else {
      await sendBasicEmail(
        inviteeContact,
        'You have a SproutBook family invitation',
        `
          <p>You have been invited to view family recaps on SproutBook.</p>
          <p><strong>Invite code:</strong> ${inviteCode}</p>
          <p>Open the app and enter this code, or click <a href="${appLinks.webAccept}?code=${inviteCode}">accept invite</a>.</p>
          <p>
            Get the app: 
            <a href="${appLinks.ios}">iOS</a> | 
            <a href="${appLinks.android}">Android</a>
          </p>
        `
      );
    }
  } catch (mailErr) {
    console.error('Failed to send invitation email:', mailErr);
    // Do not throw — the invite is still created and can be shared via code
  }
}
```

- Detection is naive (`/@/`), adjust if you support phone numbers.
- Email failures are logged but not fatal to the invite flow.

Frontend remains the same: `FamilySharingScreen` can still offer copy/share. Now the backend also emails the invite automatically when the user typed an email in `inviteeContact`.

---

## 6) Referrals: Firestore trigger to send email

Recommended pattern: create a `referrals` doc and send an email on create.

Schema suggestion (`referrals/{referralId}`):

```
{
  createdBy: string (uid),
  email: string,
  code: string,            # referral code
  status: 'pending'|'completed',
  createdAt: Timestamp,
  completedAt?: Timestamp,
}
```

Add a trigger in `functions/index.js` (or a separate module) — example:

```js
const functions = require('firebase-functions');
const { admin } = require('./firebaseAdmin');
const { sendBasicEmail, sendTemplateEmail } = require('./services/emailService');

exports.onReferralCreated = functions.firestore
  .document('referrals/{referralId}')
  .onCreate(async (snap, context) => {
    const ref = snap.data();
    if (!ref?.email) return;
    try {
      if (process.env.REFERRAL_TEMPLATE_ID) {
        await sendTemplateEmail(ref.email, process.env.REFERRAL_TEMPLATE_ID, {
          referral_code: ref.code,
        });
      } else {
        await sendBasicEmail(
          ref.email,
          'Your SproutBook referral',
          `<p>Your referral code is <strong>${ref.code}</strong>.</p>`
        );
      }
    } catch (e) {
      console.error('Referral email error:', e);
    }
  });
```

Idempotency: If you might write multiple times, add a `emailSent: true` flag after success and check before sending.

---

## 7) Gift cards: Firestore trigger to send email

Schema suggestion (`giftCards/{giftCardId}`):

```
{
  purchaserId: string,
  recipientEmail: string,
  amountCents: number,
  currency: 'USD',
  code: string,             # redemption code
  message?: string,
  status: 'active'|'redeemed'|'canceled',
  emailSent?: boolean,
  createdAt: Timestamp,
  redeemedAt?: Timestamp,
}
```

Trigger example:

```js
exports.onGiftCardCreated = functions.firestore
  .document('giftCards/{giftCardId}')
  .onCreate(async (snap) => {
    const gc = snap.data();
    if (!gc?.recipientEmail || gc.emailSent) return;
    try {
      if (process.env.GIFTCARD_TEMPLATE_ID) {
        await sendTemplateEmail(gc.recipientEmail, process.env.GIFTCARD_TEMPLATE_ID, {
          amount: (gc.amountCents / 100).toFixed(2),
          currency: gc.currency || 'USD',
          code: gc.code,
          message: gc.message || '',
        });
      } else {
        await sendBasicEmail(
          gc.recipientEmail,
          'You received a SproutBook gift card',
          `
            <p>You have received a gift card.</p>
            <p><strong>Code:</strong> ${gc.code}</p>
            <p><strong>Amount:</strong> ${(gc.amountCents / 100).toFixed(2)} ${gc.currency || 'USD'}</p>
          `
        );
      }
      await snap.ref.update({ emailSent: true });
    } catch (e) {
      console.error('Gift card email error:', e);
    }
  });
```

---

## 8) Testing

- Local: `cd functions && npm run serve` (use emulators) with `.env` present.
- Create a test invitation via your app; check Functions logs for "Failed to send" or success.
- For triggers, write a sample doc into `referrals/` or `giftCards/` in the emulator and verify email send.

---

## 9) Security & Deliverability tips

- Do not block core flows on email delivery; log and continue.
- Use verified sender domains and DMARC/DKIM/SPF for higher inbox placement.
- Use template IDs for consistent branding and localization.
- Rate-limit triggers if needed to avoid bursts.

---

## 10) Summary

- Add SendGrid env vars.
- Install `@sendgrid/mail` and create `emailService.js`.
- Call email sending in `family-createInvitation` after the invite is created.
- Add Firestore triggers for referrals and gift cards with idempotency flags.

This gives you reliable email delivery for invitations, referrals, and gift cards with minimal code changes.
