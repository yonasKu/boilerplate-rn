import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '../lib/firebase/firebaseConfig';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { checkOnboardingStatus, OnboardingStatus } from '../services/userService';
import { NotificationService } from '@/services/notifications/NotificationService';

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

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      
      // Check onboarding status when user changes
      if (currentUser) {
        // Skip onboarding check for unverified users to prevent permission errors
        if (currentUser.emailVerified) {
          await refreshOnboardingStatus();
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
        await NotificationService.removeTokenFromFirestore(user.uid);
      } catch (error) {
        console.error('Error removing push token during sign out:', error);
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
    isAuthenticated: !!user,
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
