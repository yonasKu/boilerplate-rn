import { auth } from '../lib/firebase/firebaseConfig';
import { signInAnonymously } from 'firebase/auth';

export interface Invitation {
  id?: string;
  inviterId: string;
  inviteeContact: string;
  role: 'viewer';
  status: 'pending' | 'accepted' | 'revoked';
  inviteCode: string;
  expiresAt: string;
  scopes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SharedAccess {
  id?: string;
  ownerId: string;
  viewerId: string;
  scopes: string[];
  createdAt: string;
  updatedAt: string;
  viewer?: {
    uid: string;
    name: string;
    profileImageUrl: string;
  };
  owner?: {
    uid: string;
    name: string;
    profileImageUrl: string;
  };
}

export type AccountType = 'full' | 'view-only';

export interface FamilyMember {
  userId: string;
  email: string;
  name: string;
  accountType: 'full' | 'view-only';
  parentUserId?: string;
  permissions: {
    canViewEntries: boolean;
    canEditEntries: boolean;
    canAddChildren: boolean;
  };
}

// HTTP helpers (mirrors referralService.ts)
const buildFunctionUrl = (name: string) => {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Missing EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  return `https://us-central1-${projectId}.cloudfunctions.net/${name}`;
};

const getIdTokenOrAnon = async (): Promise<string> => {
  try {
    const user = auth.currentUser || (await signInAnonymously(auth)).user;
    const token = await user.getIdToken(true);
    console.log('[FamilyService] Using ID token prefix:', token?.slice(0, 12), 'len:', token?.length ?? 0);
    return token;
  } catch (e) {
    const cred = await signInAnonymously(auth);
    const token = await cred.user.getIdToken(true);
    console.log('[FamilyService] Using ID token prefix:', token?.slice(0, 12), 'len:', token?.length ?? 0);
    return token;
  }
};

const safeJson = async (resp: any) => {
  try { return await resp.json(); } catch { return undefined; }
};

export const FamilyService = {
  createInvitation: async (data: {
    inviteeContact: string;
    scopes?: string[];
  }): Promise<{ invitationId: string; inviteCode: string; expiresAt: string; scopes: string[] }> => {
    try {
      const token = await getIdTokenOrAnon();
      const url = buildFunctionUrl('familyCreateInvitation');
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          inviteeContact: data.inviteeContact,
          scopes: data.scopes || ['recaps:read'],
        }),
      } as any);
      if (!(resp as any).ok) {
        const err = await safeJson(resp);
        throw new Error(err?.error || 'Failed to create invitation');
      }
      return await (resp as any).json();
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  },

  getInvitations: async (): Promise<Invitation[]> => {
    try {
      const token = await getIdTokenOrAnon();
      const url = buildFunctionUrl('familyGetInvitations');
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      } as any);
      if (!(resp as any).ok) {
        const err = await safeJson(resp);
        throw new Error(err?.error || 'Failed to fetch invitations');
      }
      const data = await (resp as any).json();
      console.log('🔍 familyGetInvitations response:', data);
      return data.invitations as Invitation[];
    } catch (error) {
      console.error('Error getting invitations:', error);
      throw error;
    }
  },

  acceptInvitation: async (inviteCode: string): Promise<{ success: boolean; ownerId: string; viewerId: string; accessId: string; scopes: string[] }> => {
    try {
      const token = await getIdTokenOrAnon();
      const url = buildFunctionUrl('familyAcceptInvitation');
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode }),
      } as any);
      if (!(resp as any).ok) {
        const err = await safeJson(resp);
        throw new Error(err?.error || 'Failed to accept invitation');
      }
      return await (resp as any).json();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  },

  updatePermissions: async (viewerId: string, scopes: string[]): Promise<{ success: boolean; accessId: string; scopes: string[] }> => {
    try {
      const token = await getIdTokenOrAnon();
      const url = buildFunctionUrl('familyUpdatePermissions');
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ viewerId, scopes }),
      } as any);
      if (!(resp as any).ok) {
        const err = await safeJson(resp);
        throw new Error(err?.error || 'Failed to update permissions');
      }
      return await (resp as any).json();
    } catch (error) {
      console.error('Error updating permissions:', error);
      throw error;
    }
  },

  revokeAccess: async (viewerId: string): Promise<{ success: boolean; accessId: string; alreadyRevoked?: boolean }> => {
    try {
      const token = await getIdTokenOrAnon();
      const url = buildFunctionUrl('familyRevokeAccess');
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ viewerId }),
      } as any);
      if (!(resp as any).ok) {
        const err = await safeJson(resp);
        throw new Error(err?.error || 'Failed to revoke access');
      }
      return await (resp as any).json();
    } catch (error) {
      console.error('Error revoking access:', error);
      throw error;
    }
  },

  getSharedAccess: async (): Promise<SharedAccess[]> => {
    try {
      const token = await getIdTokenOrAnon();
      const url = buildFunctionUrl('familyGetSharedAccess');
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ includeProfiles: true }),
      } as any);
      if (!(resp as any).ok) {
        const err = await safeJson(resp);
        throw new Error(err?.error || 'Failed to fetch shared access');
      }
      const data = await (resp as any).json();
      console.log('🔍 familyGetSharedAccess response:', data);
      return data.sharedAccess as SharedAccess[];
    } catch (error) {
      console.error('Error getting shared access:', error);
      throw error;
    }
  },

  getAccountStatus: async (): Promise<{ accountType: AccountType; sharedAccess: SharedAccess[] }> => {
    try {
      const token = await getIdTokenOrAnon();
      const url = buildFunctionUrl('familyGetAccountStatus');
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ includeProfiles: true }),
      } as any);
      if (!(resp as any).ok) {
        const err = await safeJson(resp);
        throw new Error(err?.error || 'Failed to fetch account status');
      }
      const data = await (resp as any).json();
      console.log('🔍 familyGetAccountStatus response:', data);
      return data;
    } catch (error) {
      console.error('Error getting account status:', error);
      throw error;
    }
  },

  isViewer: async (): Promise<boolean> => {
    try {
      const token = await getIdTokenOrAnon();
      const url = buildFunctionUrl('familyGetSharedAccess');
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      } as any);
      if (!(resp as any).ok) {
        return false;
      }
      const data = await (resp as any).json();
      return Array.isArray(data.sharedAccess) && data.sharedAccess.length > 0;
    } catch (error) {
      console.error('Error checking viewer status:', error);
      return false;
    }
  }
};
