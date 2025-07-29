import { Stack } from 'expo-router';
import React from 'react';

// This is the layout for the authentication stack. 
// It will manage screens like Login, Signup, etc.

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      {/* Add other auth screens here as needed */}
    </Stack>
  );
}
