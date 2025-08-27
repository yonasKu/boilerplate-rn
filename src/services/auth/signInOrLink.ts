import { getAuth, linkWithCredential, signInWithCredential, EmailAuthProvider, type AuthCredential, type UserCredential } from 'firebase/auth';

/**
 * signInOrLinkWithCredential
 * - If the current user is anonymous, link the given credential to preserve UID.
 * - Otherwise, sign in with the credential.
 */
export async function signInOrLinkWithCredential(credential: AuthCredential): Promise<UserCredential> {
  const auth = getAuth();
  if (auth.currentUser?.isAnonymous) {
    return await linkWithCredential(auth.currentUser, credential);
  }
  return await signInWithCredential(auth, credential);
}

/**
 * linkIfAnonymousWithEmail
 * - If the current user is anonymous, link the email/password credential and return the UserCredential.
 * - If not anonymous, returns null (caller should proceed with normal sign-in or sign-up).
 */
export async function linkIfAnonymousWithEmail(email: string, password: string): Promise<UserCredential | null> {
  const auth = getAuth();
  if (!auth.currentUser?.isAnonymous) return null;
  const cred = EmailAuthProvider.credential(email, password);
  return await linkWithCredential(auth.currentUser, cred);
}

/**
 * isCurrentUserAnonymous
 */
export function isCurrentUserAnonymous(): boolean {
  const auth = getAuth();
  return !!auth.currentUser?.isAnonymous;
}
