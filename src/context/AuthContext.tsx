import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '../lib/firebase/firebaseConfig';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { checkOnboardingStatus, OnboardingStatus } from '../services/userService';
import { NotificationService } from '@/services/notifications/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReferralService } from '@/services/referralService';

// Define the shape of the context data
interface AuthContextType {
  user: User | null; // The Firebase user object
  isAuthenticated: boolean; // Simple boolean flag
  isLoading: boolean; // To handle initial auth state loading
  onboardingStatus: OnboardingStatus | null; // User's onboarding completion status
  isCheckingOnboarding: boolean; // Loading state for onboarding check
  signOut: () => Promise<void>;
  refreshOnboardingStatus: () => Promise<void>; // Function to refresh onboarding status
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);

  // Function to check and update onboarding status
  const refreshOnboardingStatus = async () => {
    if (!user) {
      setOnboardingStatus(null);
      return;
    }

    setIsCheckingOnboarding(true);
    try {
      const status = await checkOnboardingStatus(user.uid);
      setOnboardingStatus(status);
      console.log('Onboarding status updated:', status);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setOnboardingStatus({
        hasProfile: false,
        hasChild: false,
        isComplete: false
      });
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  // Attempt to process any referral code captured before auth
  const applyPendingReferralIfAny = async () => {
    try {
      const stored = await AsyncStorage.getItem('@pendingReferralCode');
      const code = (stored || '').trim();
      if (!code) return;
      console.log('[AuthContext] Found @pendingReferralCode, attempting to process');
      try {
        await ReferralService.processReferral(code);
        console.log('[AuthContext] Referral processed successfully');
      } catch (e) {
        console.error('[AuthContext] Failed to process referral code:', e);
      } finally {
        await AsyncStorage.removeItem('@pendingReferralCode');
      }
    } catch (e) {
      console.error('[AuthContext] Error reading @pendingReferralCode:', e);
    }
  };

  // Attempt to accept any pending family invite captured before auth (from EnterInviteCodeScreen)
  const applyPendingInviteIfAny = async () => {
    try {
      const stored = await AsyncStorage.getItem('@pendingInviteCode');
      const code = (stored || '').trim();
      if (!code) return;
      console.log('[AuthContext] Found @pendingInviteCode, attempting to accept');
      try {
        const { FamilyService } = await import('@/services/familyService');
        await FamilyService.acceptInvitation(code);
        console.log('[AuthContext] Pending invite accepted successfully');
      } catch (e) {
        console.error('[AuthContext] Failed to accept pending invite code:', e);
      } finally {
        await AsyncStorage.removeItem('@pendingInviteCode');
      }
    } catch (e) {
      console.error('[AuthContext] Error reading @pendingInviteCode:', e);
    }
  };

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      
      // Check onboarding status when user changes
      if (currentUser) {
        // Make sure we have the latest emailVerified flag
        try {
          await currentUser.reload();
        } catch (e) {
          console.warn('[AuthContext] user.reload() failed (non-fatal):', e);
        }
        // Skip onboarding check for unverified users to prevent permission errors
        if (currentUser.emailVerified) {
          // Ensure users/{uid} doc exists even if user re-opened the app after verifying email
          // This covers flows that don't pass through the explicit login handler
          try {
            const { ensureUserDocumentExists } = await import('../services/userService');
            await ensureUserDocumentExists(
              currentUser.uid,
              currentUser.displayName ?? null,
              currentUser.email ?? null
            );
          } catch (e) {
            console.warn('[AuthContext] ensureUserDocumentExists on verified session failed (non-fatal):', e);
          }

          await refreshOnboardingStatus();
          // Process any pending referral captured pre-auth (deep link or manual entry)
          await applyPendingReferralIfAny();
          // Process any pending family invite code captured pre-auth
          await applyPendingInviteIfAny();
          // Initialize and register notifications for this user
          try {
            await NotificationService.initAndRegister(currentUser.uid);
          } catch (e) {
            console.error('Error initializing notifications:', e);
          }
        } else {
          console.log('User not verified, skipping onboarding check');
          setOnboardingStatus({
            hasProfile: false,
            hasChild: false,
            isComplete: false
          });
        }
      } else {
        setOnboardingStatus(null);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

      const handleSignOut = async () => {
    if (user) {
      try {
        // Best-effort unregister of the current device's token via backend
        await NotificationService.unregisterCurrentDevice(user.uid);
      } catch (error) {
        console.error('Error unregistering device during sign out:', error);
      }
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user && !!user.emailVerified,
    isLoading,
    onboardingStatus,
    isCheckingOnboarding,
    signOut: handleSignOut,
    refreshOnboardingStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
