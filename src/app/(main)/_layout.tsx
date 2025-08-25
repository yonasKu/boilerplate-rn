import { Stack } from 'expo-router';
import React from 'react';

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="account-settings" />
      <Stack.Screen name="child-profiles" />
      <Stack.Screen name="partner-access" />
      <Stack.Screen name="refer-a-friend" />
      <Stack.Screen name="gift-card" />
      <Stack.Screen name="gift-card-confirmation" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="notification-test" />
      <Stack.Screen
        name="search-tray"
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
        }}
      />
    </Stack>
  );
}

