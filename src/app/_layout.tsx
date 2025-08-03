import React, { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { OnboardingProvider, useOnboarding } from '../context/OnboardingContext';
import { useRouter, useSegments } from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { viewedOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  const inAuthGroup = segments[0] === '(auth)';
  const inMainGroup = segments[0] === '(main)';

  useEffect(() => {
    if (authLoading || onboardingLoading) {
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
    } else if (user && !inAuthGroup && !inMainGroup && segments && segments.length > 0) {
      // User is authenticated but not in any flow - only redirect to main app
      // Allow auth flow completion (verify-email, pricing, etc.)
      console.log('Authenticated user, redirecting to main app...');
      router.replace('/(main)/(tabs)/journal');
    }

    setIsNavigationReady(true);
  }, [user, authLoading, onboardingLoading, viewedOnboarding, segments, inAuthGroup, inMainGroup]);

  if (authLoading || onboardingLoading || !isNavigationReady) {
    return null; // Keep splash screen visible
  }

  return <Stack screenOptions={{ headerShown: false }} />;
};

const RootLayoutNav = () => {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <OnboardingProvider>
        <InitialLayout />
        <StatusBar style="auto" />
      </OnboardingProvider>
    </AuthProvider>
  );
};

export default RootLayoutNav;
