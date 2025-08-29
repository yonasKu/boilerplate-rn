import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { useAccount } from '@/context/AccountContext';

const STORAGE_KEY = '@activeTimelineOwnerId';

export interface ActiveTimelineContextType {
  activeOwnerId: string | null;
  setActiveOwner: (ownerId: string) => Promise<void>;
  loading: boolean;
  availableTimelines: string[]; // [self, ...shared ownerIds]
  isViewingOthers: boolean;
  canCreateEntries: boolean; // true only when viewing self AND accountType is 'full'
}

const ActiveTimelineContext = createContext<ActiveTimelineContextType | undefined>(undefined);

export const ActiveTimelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { accountType, sharedAccess } = useAccount();
  const [activeOwnerId, setActiveOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const availableTimelines = useMemo(() => {
    const owners = new Set<string>();
    if (user?.uid) owners.add(user.uid);
    (sharedAccess || []).forEach(sa => owners.add(sa.ownerId));
    return Array.from(owners);
  }, [user?.uid, sharedAccess]);

  const persistActiveOwner = useCallback(async (ownerId: string | null) => {
    try {
      if (!ownerId) {
        await AsyncStorage.removeItem(STORAGE_KEY);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, ownerId);
      }
    } catch (e) {
      console.warn('Failed to persist active owner id', e);
    }
  }, []);

  const setActiveOwner = useCallback(async (ownerId: string) => {
    // validate ownerId is in available timelines
    if (!availableTimelines.includes(ownerId)) {
      console.warn('Attempt to set invalid active owner id:', ownerId);
      return;
    }
    setActiveOwnerId(ownerId);
    await persistActiveOwner(ownerId);
  }, [availableTimelines, persistActiveOwner]);

  // Initialize active owner from storage or default to self
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const fallback = user?.uid || null;
        const initial = stored && availableTimelines.includes(stored) ? stored : fallback;
        if (mounted) setActiveOwnerId(initial);
        if (stored !== initial) await persistActiveOwner(initial);
      } catch (e) {
        console.warn('Failed to load active timeline from storage', e);
        setActiveOwnerId(user?.uid || null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.uid, availableTimelines, persistActiveOwner]);

  // Reconcile when sharedAccess changes (remove invalid selection)
  useEffect(() => {
    if (!activeOwnerId) return;
    if (!availableTimelines.includes(activeOwnerId)) {
      // fallback to self
      const fallback = user?.uid || null;
      setActiveOwnerId(fallback);
      persistActiveOwner(fallback);
    }
  }, [availableTimelines, activeOwnerId, user?.uid, persistActiveOwner]);

  // If account is view-only, auto-switch to the inviter's owner timeline
  useEffect(() => {
    // Only proceed if logged in and account is view-only
    if (!user?.uid) return;
    if ((accountType ?? 'full') !== 'view-only') return;

    // If currently viewing self but we have shared owners, switch to the first shared owner
    const isViewingSelf = !activeOwnerId || activeOwnerId === user.uid;
    if (isViewingSelf && sharedAccess && sharedAccess.length > 0) {
      const ownerId = sharedAccess[0]?.ownerId;
      if (ownerId && availableTimelines.includes(ownerId)) {
        setActiveOwnerId(ownerId);
        persistActiveOwner(ownerId);
      }
    }
  }, [user?.uid, accountType, sharedAccess, availableTimelines, activeOwnerId, persistActiveOwner]);

  const isViewingOthers = useMemo(() => {
    if (!user?.uid || !activeOwnerId) return false;
    return activeOwnerId !== user.uid;
  }, [user?.uid, activeOwnerId]);

  const canCreateEntries = useMemo(() => {
    // Only self timeline AND full account can create
    const isSelf = !isViewingOthers;
    const isFull = (accountType ?? 'full') === 'full';
    return Boolean(isSelf && isFull);
  }, [isViewingOthers, accountType]);

  const value = useMemo<ActiveTimelineContextType>(() => ({
    activeOwnerId,
    setActiveOwner,
    loading,
    availableTimelines,
    isViewingOthers,
    canCreateEntries,
  }), [activeOwnerId, setActiveOwner, loading, availableTimelines, isViewingOthers, canCreateEntries]);

  return (
    <ActiveTimelineContext.Provider value={value}>
      {children}
    </ActiveTimelineContext.Provider>
  );
};

export const useActiveTimeline = (): ActiveTimelineContextType => {
  const ctx = useContext(ActiveTimelineContext);
  if (!ctx) throw new Error('useActiveTimeline must be used within an ActiveTimelineProvider');
  return ctx;
};
