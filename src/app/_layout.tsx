import { Slot, SplashScreen, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function Layout() {
  const [fontsLoaded, error] = useFonts({
    'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { isAuthenticated } = useAuth();
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

  // useEffect(() => {
  //   // Wait until fonts are loaded and onboarding status has been checked
  //   if (!fontsLoaded || viewedOnboarding === null) return;

  //   // If onboarding has not been viewed, redirect to the onboarding screen
  //   if (!viewedOnboarding) {
  //     router.replace('/onboarding');
  //     return;
  //   }

  //   // --- Existing Authentication Logic ---
  //   const inAuthGroup = segments[0] === '(auth)';

  //   // If the user is authenticated and the initial segment is not in the main app group,
  //   // redirect them to the main journal screen.
  //   if (isAuthenticated && inAuthGroup) {
  //     router.replace('/(main)/journal');
  //   } 
  //   // If the user is not authenticated and they are not in the auth group,
  //   // redirect them to the welcome screen.
  //   else if (!isAuthenticated && !inAuthGroup) {
  //     router.replace('/(auth)/welcome');
  //   }
  // }, [isAuthenticated, segments, fontsLoaded, router, viewedOnboarding]);

  if (!fontsLoaded) {
    return null; // Render nothing until the fonts are loaded
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
