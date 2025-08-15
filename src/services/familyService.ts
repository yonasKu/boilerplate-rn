import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';

export interface Invitation {
  id?: string;
  senderUserId: string;
  recipientEmail: string;
  recipientUserId?: string;
  invitationType: 'family_view' | 'upgrade';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  permissions?: {
    canViewEntries: boolean;
    canEditEntries: boolean;
    canAddChildren: boolean;
  };
  childrenAccess?: string[];
  features?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SharedAccess {
  id?: string;
  grantorUserId: string;
  granteeUserId: string;
  permissions: {
    canViewEntries: boolean;
    canEditEntries: boolean;
    canAddChildren: boolean;
  };
  childrenAccess: string[];
  features: string[];
  createdAt: Date;
}

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

export const FamilyService = {
  invitationsCollection: 'invitations',
  sharedAccessCollection: 'sharedAccess',

  createInvitation: async (data: {
    senderUserId: string;
    recipientEmail: string;
    invitationType: 'family_view' | 'upgrade';
    permissions?: {
      canViewEntries: boolean;
      canEditEntries: boolean;
      canAddChildren: boolean;
    };
    childrenAccess?: string[];
    features?: string[];
  }): Promise<string> => {
    try {
      const invitationData = {
        senderUserId: data.senderUserId,
        recipientEmail: data.recipientEmail,
        invitationType: data.invitationType,
        status: 'pending' as const,
        permissions: data.permissions || { canViewEntries: true, canEditEntries: false, canAddChildren: false },
        childrenAccess: data.childrenAccess || [],
        features: data.features || [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'invitations'), invitationData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw new Error('Failed to create invitation');
    }
  },

  getInvitations: async (userId: string): Promise<Invitation[]> => {
    try {
      const q = query(
        collection(db, 'invitations'),
        where('senderUserId', '==', userId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      } as Invitation));
    } catch (error) {
      console.error('Error getting invitations:', error);
      throw new Error('Failed to get invitations');
    }
  },

  acceptInvitation: async (invitationId: string, recipientUserId: string): Promise<void> => {
    try {
      await updateDoc(doc(db, 'invitations', invitationId), {
        status: 'accepted',
        recipientUserId,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw new Error('Failed to accept invitation');
    }
  },

  createSharedAccess: async (data: {
    grantorUserId: string;
    granteeUserId: string;
    permissions: {
      canViewEntries: boolean;
      canEditEntries: boolean;
      canAddChildren: boolean;
    };
    childrenAccess: string[];
    features: string[];
  }): Promise<string> => {
    try {
      const accessData = {
        grantorUserId: data.grantorUserId,
        granteeUserId: data.granteeUserId,
        permissions: data.permissions,
        childrenAccess: data.childrenAccess,
        features: data.features,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'sharedAccess'), accessData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating shared access:', error);
      throw new Error('Failed to create shared access');
    }
  },
};
