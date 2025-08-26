import React, { PropsWithChildren, useEffect } from 'react';
import { router } from 'expo-router';
import { useSubscription } from '@/hooks/useSubscription';

interface PremiumGateProps extends PropsWithChildren {
  fallback?: React.ReactNode;
}

export default function PremiumGate({ children, fallback = null }: PremiumGateProps) {
  const { isActive, loading } = useSubscription();

  useEffect(() => {
    if (!loading && !isActive) {
      // Navigate to pricing screen in auth group
      router.push('/(auth)/pricing');
    }
  }, [loading, isActive]);

  if (loading) return null;
  if (!isActive) return <>{fallback}</>;
  return <>{children}</>;
}
