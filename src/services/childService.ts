import { collection, addDoc, getDocs, query, where, doc, updateDoc, arrayUnion, arrayRemove, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/firebaseConfig';

export interface Child {
  id?: string;
  parentId: string;
  name: string;
  dateOfBirth: Date;
  gender: 'Boy' | 'Girl' | 'other' | 'prefer_not_to_say' | "Don't know yet";
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChildInput {
  name: string;
  dateOfBirth: Date;
  gender: 'Boy' | 'Girl' | 'other' | 'prefer_not_to_say' | "Don't know yet";
  avatar?: string;
  profileImageUrl?: string;
}

export const addChild = async (child: ChildInput, parentId: string): Promise<string> => {
  try {
    const now = new Date();

    const childData = {
      ...child,
      parentId,
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(collection(db, 'children'), childData);
    
    // Update user's children array
    await updateUserChildrenArray(parentId, docRef.id);
    
    console.log('Child added successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding child:', error);
    throw error;
  }
};

export const getUserChildren = async (parentId: string): Promise<Child[]> => {
  try {
    const q = query(collection(db, 'children'), where('parentId', '==', parentId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : new Date(data.dateOfBirth),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as Child;
    });
  } catch (error) {
    console.error('Error fetching user children:', error);
    throw error;
  }
};

export const getChild = async (childId: string): Promise<Child | null> => {
  try {
    const childRef = doc(db, 'children', childId);
    const childSnap = await getDoc(childRef);

    if (childSnap.exists()) {
      const data = childSnap.data();
      return {
        id: childSnap.id,
        ...data,
        dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : new Date(data.dateOfBirth),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as Child;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error('Error fetching child by ID:', error);
    throw error;
  }
};

export const updateChild = async (childId: string, dataToUpdate: Partial<ChildInput>): Promise<void> => {
  try {
    const childRef = doc(db, 'children', childId);
    await updateDoc(childRef, {
      ...dataToUpdate,
      updatedAt: new Date()
    });
    console.log('Child updated successfully');
  } catch (error) {
    console.error('Error updating child:', error);
    throw error;
  }
};

export const updateUserChildrenArray = async (userId: string, childId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      children: arrayUnion(childId),
      updatedAt: new Date(),
      onboarded: true
    });
    console.log('User children array updated successfully');
  } catch (error) {
    console.error('Error updating user children array:', error);
    throw error;
  }
};

export const deleteChild = async (childId: string, parentId: string): Promise<void> => {
  try {
    // Delete the child document
    await deleteDoc(doc(db, 'children', childId));

    // Remove from the user's children array
    const userRef = doc(db, 'users', parentId);
    await updateDoc(userRef, {
      children: arrayRemove(childId),
      updatedAt: new Date(),
    });

    console.log('Child deleted successfully:', childId);
  } catch (error) {
    console.error('Error deleting child:', error);
    throw error;
  }
};
