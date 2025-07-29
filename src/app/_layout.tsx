import { Slot, SplashScreen, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '@/context/AuthContext';

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

  useEffect(() => {
    if (!fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    // If the user is authenticated and the initial segment is not in the main app group,
    // redirect them to the main journal screen.
    if (isAuthenticated && inAuthGroup) {
      router.replace('/(main)/journal');
    } 
    // If the user is not authenticated and they are not in the auth group,
    // redirect them to the welcome screen.
    else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    }
  }, [isAuthenticated, segments, fontsLoaded, router]);

  if (!fontsLoaded) {
    return null; // Render nothing until the fonts are loaded
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}
