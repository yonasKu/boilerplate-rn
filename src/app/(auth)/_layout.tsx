import { Stack } from 'expo-router';
import React from 'react';
import CustomHeader from '@/features/auth/components/CustomHeader';
import LoginHeader from '@/features/auth/components/LoginHeader';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen
        name="signup"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="success"
        options={{
          header: () => <CustomHeader title="Success" showBackButton={false} />,
        }}
      />
      <Stack.Screen
        name="pricing"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
          // header: (props) => <LoginHeader title="Log in" {...props} />,
        }}
      />
      <Stack.Screen
        name="add-child-details"
        options={{
          header: () => <CustomHeader title="" />,
        }}
      />
      <Stack.Screen
        name="add-profile"
        options={{
          header: () => <CustomHeader title="" />,
        }}
      />
      <Stack.Screen
        name="verify-email"
        options={{
          headerShown: false,
          // header: () => <CustomHeader title="" />,
        }}
      />
      <Stack.Screen
        name="enter-invite"
        options={{
          headerShown: false,
          // header: () => <CustomHeader title="Enter Invite Code" />,
        }}
      />
      <Stack.Screen
        name="enter-referral-code"
        options={{
          headerShown: false,
          // header: () => <CustomHeader title="Enter Invite Code" />,
        }}
      />
    </Stack>
  );
}
