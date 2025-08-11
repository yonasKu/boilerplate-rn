import { Stack } from 'expo-router';
import React from 'react';
import CustomHeader from '../../features/auth/components/CustomHeader';

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
          header: () => <CustomHeader title="Sign Up" />,
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
          header: () => <CustomHeader title="Pricing" />,
        }}
      />
      <Stack.Screen 
        name="checkout" 
        options={{
          header: () => <CustomHeader title="Checkout" />,
        }}
      />
      <Stack.Screen 
        name="login" 
        options={{
          header: () => <CustomHeader title="Login" />,
        }}
      />
       <Stack.Screen 
        name="add-child-details" 
        options={{
          header: () => <CustomHeader title="Tell us about your little one" />,
        }}
      />
       <Stack.Screen 
        name="add-profile" 
        options={{
          header: () => <CustomHeader title="Tell us about yourself" />,
        }}
      />
        <Stack.Screen 
        name="verify-email" 
        options={{
          header: () => <CustomHeader title="Verify Email" />,
        }}
      />
    </Stack>
  );
}
