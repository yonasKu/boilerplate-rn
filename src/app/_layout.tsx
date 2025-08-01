import { Slot, SplashScreen, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { OnboardingProvider, useOnboarding } from '@/context/OnboardingContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function Layout() {
  const [fontsLoaded, fontError] = useFonts({
    'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { viewedOnboarding, isLoading: isOnboardingLoading } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (fontError) throw fontError;
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const isLoading = !fontsLoaded || isAuthLoading || isOnboardingLoading;
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    console.log('--- NAVIGATING ---');
    console.log('viewedOnboarding:', viewedOnboarding);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('segments:', segments);
    console.log('------------------');

    // If onboarding hasn't been seen, it's the highest priority.
    if (!viewedOnboarding) {
      // Only redirect if we're not already on the onboarding screen
      if (segments[0] !== 'onboarding') {
        router.replace('/onboarding');
      }
      return;
    }

    // If onboarding is done, but user is not logged in AND they are not in the auth flow,
    // send them to the auth flow (welcome screen).
    if (viewedOnboarding && !isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
      return;
    }

    // If user is logged in but is still in the auth flow, send them to the main app.
    if (isAuthenticated && inAuthGroup) {
      router.replace('/(main)/journal');
      return;
    }

    // If the user is authenticated and has seen onboarding, but is not in the main app, send them there.
    if (isAuthenticated && viewedOnboarding && segments[0] !== '(main)') {
      router.replace('/(main)/journal');
      return;
    }
  }, [fontsLoaded, isAuthenticated, isAuthLoading, viewedOnboarding, isOnboardingLoading, segments, router]);

  const isLoading = !fontsLoaded || isAuthLoading || isOnboardingLoading;
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#5D9275" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#2F4858' }}>Loading...</Text>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OnboardingProvider>
          <Layout />
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
