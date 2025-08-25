import { getFirestore, collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export interface InAppNotification {
  type: 'recap_love' | 'comment' | 'reminder' | 'streak';
  users?: Array<{
    name: string;
    avatar?: string;
  }>;
  recap?: string;
  comment?: string;
  date?: string;
  isRead?: boolean;
  createdAt?: any;
}

export class InAppNotificationService {
  static async createNotification(userId: string, notification: Omit<InAppNotification, 'createdAt' | 'isRead'>) {
    try {
      const db = getFirestore();
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      
      await addDoc(notificationsRef, {
        ...notification,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async markAsRead(userId: string, notificationId: string) {
    try {
      const db = getFirestore();
      const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
      
      await updateDoc(notificationRef, {
        isRead: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async createCommentNotification(userId: string, commenterName: string, comment: string) {
    return this.createNotification(userId, {
      type: 'comment',
      users: [{ name: commenterName }],
      comment,
    });
  }

  static async createRecapLoveNotification(userId: string, users: Array<{name: string}>, recap: string) {
    return this.createNotification(userId, {
      type: 'recap_love',
      users,
      recap,
    });
  }

  static async createReminderNotification(userId: string, reminderText: string) {
    return this.createNotification(userId, {
      type: 'reminder',
      comment: reminderText,
    });
  }

  static async createStreakNotification(userId: string, streakText: string) {
    return this.createNotification(userId, {
      type: 'streak',
      comment: streakText,
    });
  }
}
