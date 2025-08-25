import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FamilyService, SharedAccess, AccountType } from '@/services/familyService';

export interface AccountContextType {
  accountType: AccountType | null;
  sharedAccess: SharedAccess[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isFullAccount: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [sharedAccess, setSharedAccess] = useState<SharedAccess[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setAccountType(null);
      setSharedAccess([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { accountType, sharedAccess } = await FamilyService.getAccountStatus();
      setAccountType(accountType);
      setSharedAccess(sharedAccess || []);
    } catch (e: any) {
      console.error('AccountContext load error:', e);
      setError(e?.message || 'Failed to load account status');
      // Fallback to full for backward compatibility per design decisions
      setAccountType('full');
      setSharedAccess([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Initial load and on user change
    load();
  }, [load]);

  const value = useMemo<AccountContextType>(() => ({
    accountType,
    sharedAccess,
    loading,
    error,
    refresh: load,
    isFullAccount: (accountType ?? 'full') === 'full',
  }), [accountType, sharedAccess, loading, error, load]);

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = (): AccountContextType => {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within an AccountProvider');
  return ctx;
};
