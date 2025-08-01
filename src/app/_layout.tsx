import { Slot, SplashScreen, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function Layout() {
  const [fontsLoaded, error] = useFonts({
    'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (error) throw error;

    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

    const [viewedOnboarding, setViewedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('@viewedOnboarding');
        setViewedOnboarding(value === 'true');
      } catch (error) {
        console.error("Error reading onboarding status from AsyncStorage", error);
        setViewedOnboarding(false); // Default to showing onboarding on error
      }
    };
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    // Wait until fonts are loaded, onboarding status is checked, and auth state is known.
    if (!fontsLoaded || viewedOnboarding === null || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inMainGroup = segments[0] === '(main)';
    const isOnOnboarding = !segments[0] || segments[0] === 'onboarding';

    console.log('Navigation state:', {
      viewedOnboarding,
      isAuthenticated,
      inAuthGroup,
      inMainGroup,
      isOnOnboarding,
      segments
    });

    // If onboarding hasn't been seen, it's the highest priority.
    if (!viewedOnboarding && !isOnOnboarding) {
      console.log('Navigating to onboarding');
      router.replace('/onboarding');
      return;
    }

    // If the user is authenticated but is in the auth flow (e.g., on login screen),
    // redirect them to the main part of the app.
    if (isAuthenticated && inAuthGroup) {
      console.log('Authenticated user in auth group, redirecting to journal');
      router.replace('/(main)/journal');
    } 
    // If the user is NOT authenticated and is outside the auth flow,
    // send them to the welcome screen to log in or sign up.
    else if (!isAuthenticated && !inAuthGroup && viewedOnboarding) {
      console.log('Unauthenticated user outside auth group, redirecting to welcome');
      router.replace('/(auth)/welcome');
    }
  }, [isAuthenticated, segments, fontsLoaded, router, viewedOnboarding, isLoading]);

  // Show loading screen instead of null to prevent black screen
  if (!fontsLoaded || viewedOnboarding === null || isLoading) {
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
        <Layout />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
