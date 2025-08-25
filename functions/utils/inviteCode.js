const { admin } = require('../firebaseAdmin');

// Avoid easily confused characters: 0/O, 1/I
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateInviteCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return code;
}

async function codeExists(code) {
  const snap = await admin.firestore()
    .collection('invitations')
    .where('inviteCode', '==', code)
    .limit(1)
    .get();
  return !snap.empty;
}

async function generateUniqueInviteCode(length = 6, maxAttempts = 8) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateInviteCode(length).toUpperCase();
    // Ensure uniqueness across invitations regardless of status
    if (!(await codeExists(code))) {
      return code;
    }
  }
  throw new Error('Failed to generate a unique invite code');
}

module.exports = { generateInviteCode, generateUniqueInviteCode };
