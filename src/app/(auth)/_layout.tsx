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
          header: () => <CustomHeader title="" />,
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
          header: () => <CustomHeader />,
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
          header: (props) => <LoginHeader title="Log in" {...props} />,
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
          header: () => <CustomHeader title="" />,
        }}
      />
    </Stack>
  );
}
