import { Stack } from 'expo-router';
import React from 'react';

// This is the layout for the authentication stack. 
// It will manage screens like Login, Signup, etc.

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        
        headerShadowVisible: true,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: true, title: 'Sign Up' }} />
      <Stack.Screen name="success" options={{ headerShown: true, title: 'Success', headerBackVisible: false }} />
      <Stack.Screen name="pricing" options={{ headerShown: true, title: 'Pricing' }} />
      <Stack.Screen name="checkout" options={{ headerShown: true, title: 'Checkout' }} />
      <Stack.Screen name="login" options={{ headerShown: true, title: 'Login' }} />
    </Stack>
  );
}
