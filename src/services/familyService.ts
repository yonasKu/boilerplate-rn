import { getFunctions, httpsCallable } from 'firebase/functions';

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

const functions = getFunctions();

export const FamilyService = {
  createInvitation: async (data: {
    inviteeContact: string;
    scopes?: string[];
  }): Promise<{ invitationId: string; inviteCode: string; expiresAt: string; scopes: string[] }> => {
    try {
      const createInvitationCallable = httpsCallable<{
        inviteeContact: string;
        scopes?: string[];
      }, { invitationId: string; inviteCode: string; expiresAt: string; scopes: string[] }>(functions, 'family-createInvitation');
      
      const result = await createInvitationCallable({
        inviteeContact: data.inviteeContact,
        scopes: data.scopes || ['recaps:read'],
      });

      return result.data;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  },

  getInvitations: async (): Promise<Invitation[]> => {
    try {
      const getInvitationsCallable = httpsCallable<void, { invitations: Invitation[] }>(functions, 'family-getInvitations');
      const result = await getInvitationsCallable();
      return result.data.invitations;
    } catch (error) {
      console.error('Error getting invitations:', error);
      throw error;
    }
  },

  acceptInvitation: async (inviteCode: string): Promise<{ success: boolean; ownerId: string; viewerId: string; accessId: string; scopes: string[] }> => {
    try {
      const acceptInvitationCallable = httpsCallable<{ inviteCode: string }, { success: boolean; ownerId: string; viewerId: string; accessId: string; scopes: string[] }>(functions, 'family-acceptInvitation');
      const result = await acceptInvitationCallable({ inviteCode });
      return result.data;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  },

  updatePermissions: async (viewerId: string, scopes: string[]): Promise<{ success: boolean; accessId: string; scopes: string[] }> => {
    try {
      const updatePermissionsCallable = httpsCallable<{ viewerId: string, scopes: string[] }, { success: boolean; accessId: string; scopes: string[] }>(functions, 'family-updatePermissions');
      const result = await updatePermissionsCallable({ viewerId, scopes });
      return result.data;
    } catch (error) {
      console.error('Error updating permissions:', error);
      throw error;
    }
  },

  revokeAccess: async (viewerId: string): Promise<{ success: boolean; accessId: string; alreadyRevoked?: boolean }> => {
    try {
      const revokeAccessCallable = httpsCallable<{ viewerId: string }, { success: boolean; accessId: string; alreadyRevoked?: boolean }>(functions, 'family-revokeAccess');
      const result = await revokeAccessCallable({ viewerId });
      return result.data;
    } catch (error) {
      console.error('Error revoking access:', error);
      throw error;
    }
  },

  getSharedAccess: async (): Promise<SharedAccess[]> => {
    try {
      const getSharedAccessCallable = httpsCallable<void, { sharedAccess: SharedAccess[] }>(functions, 'family-getSharedAccess');
      const result = await getSharedAccessCallable();
      return result.data.sharedAccess;
    } catch (error) {
      console.error('Error getting shared access:', error);
      throw error;
    }
  },

  getAccountStatus: async (): Promise<{ accountType: AccountType; sharedAccess: SharedAccess[] }> => {
    try {
      const getAccountStatusCallable = httpsCallable<void, { accountType: AccountType; sharedAccess: SharedAccess[] }>(functions, 'family-getAccountStatus');
      const result = await getAccountStatusCallable();
      return result.data;
    } catch (error) {
      console.error('Error getting account status:', error);
      throw error;
    }
  },

  isViewer: async (): Promise<boolean> => {
    try {
      const getSharedAccessCallable = httpsCallable<void, { sharedAccess: SharedAccess[] }>(functions, 'family-getSharedAccess');
      const result = await getSharedAccessCallable();
      return result.data.sharedAccess && result.data.sharedAccess.length > 0;
    } catch (error) {
      console.error('Error checking viewer status:', error);
      return false;
    }
  }
};
