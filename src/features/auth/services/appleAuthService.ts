import * as AppleAuthentication from 'expo-apple-authentication';
import { OAuthProvider } from 'firebase/auth';
import { signInOrLinkWithCredential } from '@/services/auth/signInOrLink';
import { Platform } from 'react-native';

export class AppleAuthService {
  static async signInWithApple() {
    // Friendly platform/availability handling before calling native API
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Sign in with Apple is only available on iOS devices.' };
    }
    const available = await AppleAuthentication.isAvailableAsync().catch(() => false);
    if (!available) {
      return { success: false, error: 'Sign in with Apple isn’t available on this device.' };
    }
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

      // Sign in or link with Firebase (preserve UID if currently anonymous)
      const userCredential = await signInOrLinkWithCredential(firebaseCredential);

      // Ensure the users/{uid} document exists with required fields
      try {
        const { ensureUserDocumentExists } = await import('../../../services/userService');
        const user = userCredential.user;
        const given = (credential as any)?.fullName?.givenName ?? '';
        const family = (credential as any)?.fullName?.familyName ?? '';
        const appleProvidedName = `${given} ${family}`.trim();
        const bestName = appleProvidedName || user.displayName || null;
        let bestEmail = user.email ?? (credential as any)?.email ?? null;
        // Fallback: try to read email from Firebase ID token claims (some Apple logins omit email)
        if (!bestEmail) {
          try {
            const tokenResult = await user.getIdTokenResult();
            const claimsEmail = (tokenResult?.claims as any)?.email as string | undefined;
            if (claimsEmail) bestEmail = claimsEmail;
          } catch (e) {
            console.warn('AppleAuthService: could not read email from ID token claims', e);
          }
        }
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
        return { success: false, error: 'You cancelled the sign-in.' };
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
