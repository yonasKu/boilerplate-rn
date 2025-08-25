import * as AppleAuthentication from 'expo-apple-authentication';
import { auth } from '@/lib/firebase/firebaseConfig';
import { signInWithCredential, OAuthProvider } from 'firebase/auth';

export class AppleAuthService {
  static async signInWithApple() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Create Firebase credential
      const provider = new OAuthProvider('apple.com');
      const firebaseCredential = provider.credential({
        idToken: credential.identityToken || undefined,
        rawNonce: credential.authorizationCode || undefined,
      });

      // Sign in with Firebase
      const userCredential = await signInWithCredential(auth, firebaseCredential);

      // Ensure the users/{uid} document exists with required fields
      try {
        const { ensureUserDocumentExists } = await import('../../../services/userService');
        const user = userCredential.user;
        const given = (credential as any)?.fullName?.givenName ?? '';
        const family = (credential as any)?.fullName?.familyName ?? '';
        const appleProvidedName = `${given} ${family}`.trim();
        const bestName = appleProvidedName || user.displayName || null;
        const bestEmail = user.email ?? (credential as any)?.email ?? null;
        await ensureUserDocumentExists(user.uid, bestName, bestEmail);
      } catch (e) {
        console.error('Failed to ensure user document after Apple sign-in:', e);
      }

      return {
        success: true,
        user: userCredential.user,
        credential,
      };
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return { success: false, error: 'User cancelled' };
      }
      return { success: false, error: error.message };
    }
  }

  static async checkAppleSignInAvailability() {
    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch {
      return false;
    }
  }
}
