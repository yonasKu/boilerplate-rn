import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { useFonts as useExpoFonts } from 'expo-font';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '../context/AuthContext';
import { AccountProvider } from '@/context/AccountContext';
import { ActiveTimelineProvider } from '@/context/ActiveTimelineContext';
import { OnboardingProvider } from '../context/OnboardingContext';
import { useRouter, useSegments } from 'expo-router';
import { NotificationContainer } from '../components/ui/NotificationContainer';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';
import { useNotification } from '../hooks/useNotification';
import { FamilyService } from '../services/familyService';
import { useAccount } from '@/context/AccountContext';
import { setupRevenueCat } from '@/lib/revenuecat/setupRevenueCat';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { viewedOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const { accountType, loading: accountLoading } = useAccount();
  const [handledPendingInvite, setHandledPendingInvite] = useState(false);
  const { setupRealTimeNotifications } = useNotification();

  const inAuthGroup = segments[0] === '(auth)';
  const inMainGroup = segments[0] === '(main)';

  useEffect(() => {
    // Auto-accept pending invite after authentication
    const maybeAcceptPendingInvite = async () => {
      if (!user || handledPendingInvite) return;
      try {
        const code = await AsyncStorage.getItem('@pendingInviteCode');
        if (code) {
          console.log('Found pending invite code. Attempting auto-accept...');
          try {
            await FamilyService.acceptInvitation(code);
            console.log('Pending invite accepted successfully.');
          } catch (err) {
            console.error('Auto-accept invitation failed:', err);
          } finally {
            await AsyncStorage.removeItem('@pendingInviteCode');
          }
        }
      } catch (e) {
        console.error('Error handling pending invite code:', e);
      } finally {
        setHandledPendingInvite(true);
      }
    };

    maybeAcceptPendingInvite();

    if (authLoading || onboardingLoading || accountLoading || (user && !handledPendingInvite)) {
      console.log('Still loading auth or onboarding state...');
      return;
    }

    console.log('--- Root Layout Navigation ---');
    console.log('User:', user ? user.uid : 'null');
    console.log('Segments:', segments);

    // Only handle explicit redirects when absolutely necessary
    if (!user) {
      // User is not authenticated
      if (!viewedOnboarding && segments && segments.length > 0 && !(segments as string[]).includes('onboarding')) {
        console.log('Redirecting to onboarding...');
        router.replace('/onboarding');
      } else if (viewedOnboarding && !inAuthGroup && segments && !(segments as string[]).includes('welcome')) {
        console.log('Redirecting to welcome screen...');
        router.replace('/(auth)/welcome');
      }
    } else if (user) {
      const isViewerAccount = (accountType ?? 'full') === 'view-only';
      if (isViewerAccount) {
        const isOnPricing = inAuthGroup && Array.isArray(segments) && (segments as string[]).includes('pricing');
        if (!user.emailVerified) {
          if (!inAuthGroup) {
            console.log('Viewer not verified, redirecting to verify-email...');
            router.replace('/(auth)/verify-email');
          }
        } else if (!inMainGroup && !isOnPricing) {
          // Allow pricing page for viewers so they can upgrade/create their own journal
          console.log('Authenticated viewer, redirecting to main app (pricing exempt)...');
          router.replace('/(main)/(tabs)/journal');
        }
      } else if (!inAuthGroup && !inMainGroup && segments && segments.length > 0) {
        // User is authenticated but not in any flow - only redirect to main app
        // Allow auth flow completion (verify-email, pricing, etc.)
        console.log('Authenticated owner, redirecting to main app...');
        router.replace('/(main)/(tabs)/home');
      }
    }

    setIsNavigationReady(true);
  }, [user, authLoading, onboardingLoading, accountLoading, accountType, viewedOnboarding, segments, inAuthGroup, inMainGroup]);

  // Real-time Firestore -> in-app toast wiring (works on emulator; no push required)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let canceled = false;
    (async () => {
      try {
        if (user?.uid) {
          const maybeUnsub = await setupRealTimeNotifications(user.uid);
          if (!canceled) unsubscribe = maybeUnsub;
        }
      } catch (e) {
        console.warn('🔔 Failed to set up real-time notifications', e);
      }
    })();
    return () => {
      canceled = true;
      if (unsubscribe) {
        try { unsubscribe(); } catch {}
      }
    };
  }, [user?.uid, setupRealTimeNotifications]);

  if (authLoading || onboardingLoading || accountLoading || !isNavigationReady || (user && !handledPendingInvite)) {
    return null; // Keep splash screen visible
  }

  return <Stack screenOptions={{ headerShown: false }} />;
};

const RootLayoutNav = () => {
  const [loaded] = useExpoFonts({
    // your existing fonts
  });

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (loaded && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, fontsLoaded]);

  // Initialize RevenueCat once (safe if keys are not set)
  useEffect(() => {
    setupRevenueCat();
  }, []);

  // Notification tap handling (background -> opened) and cold start
  useEffect(() => {
    const handleNotificationRouting = (data: any) => {
      const type = data?.type;
      if (!type) return;
      switch (type) {
        case 'recap_comment':
        case 'recap_like': {
          const recapId = data?.recapId;
          if (!recapId) return;
          router.push({ pathname: '/recaps/[id]', params: { id: String(recapId) } });
          break;
        }
        default:
          break;
      }
    };

    // Background/foreground: user tapped a notification
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data as any;
      handleNotificationRouting(data);
    });

    // Cold start: app launched from a notification
    (async () => {
      const last = await Notifications.getLastNotificationResponseAsync();
      const data = last?.notification?.request?.content?.data as any;
      if (data) handleNotificationRouting(data);
    })();

    return () => {
      responseSub.remove();
    };
  }, []);

  // Foreground notifications: show in-app banner with action
  const { showNotification } = useNotification();
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification?.request?.content?.data as any;
      const title = notification?.request?.content?.title || 'Notification';
      const message = notification?.request?.content?.body || '';

      // Only banner for recap interactions (extend as needed)
      if (data?.type === 'recap_comment' || data?.type === 'recap_like') {
        const recapId = String(data?.recapId || '');
        if (!recapId) return;

        // Build route to recap view; open comments for recap_comment
        const basePath = '/(main)/recaps/recap-view';
        const query = data?.type === 'recap_comment' ? `?recapId=${encodeURIComponent(recapId)}&openComments=true` : `?recapId=${encodeURIComponent(recapId)}`;

        // Use actionUrl for NotificationContainer to navigate
        showNotification({
          title,
          message,
          type: 'info',
          time: 'Now',
          actionText: 'Open',
          actionUrl: `${basePath}${query}`,
          data: { ...data, persistent: true },
          isPush: true,
        });
      }
    });
    return () => sub.remove();
  }, [showNotification]);

    if (!loaded || !fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <AccountProvider>
        <ActiveTimelineProvider>
          <OnboardingProvider>
            <NotificationContainer />
            <InitialLayout />
            <StatusBar style="auto" />
          </OnboardingProvider>
        </ActiveTimelineProvider>
      </AccountProvider>
    </AuthProvider>
  );
};

export default RootLayoutNav;
