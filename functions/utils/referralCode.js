const { admin } = require('../firebaseAdmin');

// Avoid easily confused characters: 0/O, 1/I
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateReferralCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return code.toUpperCase();
}

async function codeExists(code) {
  const snap = await admin
    .firestore()
    .collection('users')
    .where('referralCode', '==', code)
    .limit(1)
    .get();
  return !snap.empty;
}

async function generateUniqueReferralCode(length = 6, maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateReferralCode(length);
    if (!(await codeExists(code))) {
      return code;
    }
  }
  throw new Error('Failed to generate a unique referral code');
}

module.exports = { generateReferralCode, generateUniqueReferralCode };
