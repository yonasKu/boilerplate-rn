import { Timestamp } from 'firebase/firestore';

export interface Recap {
  id: string;
  userId: string;
  title: string;
  content: string;
  summary: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Interaction fields
  likes: Record<string, boolean>; // userId -> true
  isFavorited: boolean;
  isMilestone: boolean;
  commentCount: number;
  lastCommentAt?: Timestamp;
  
  // Additional fields
  type?: string;
  period?: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
  media?: {
    highlightPhotos?: string[];
  };
  aiGenerated?: {
    recapText?: string;
  };
  
  // Filtering
  tags?: string[];
  childIds?: string[];
  dateRange: {
    start: Timestamp;
    end: Timestamp;
  };
}

export interface RecapComment {
  id: string;
  recapId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  text: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

