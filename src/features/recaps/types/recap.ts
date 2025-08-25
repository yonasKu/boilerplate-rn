import { Timestamp } from 'firebase/firestore';

export interface Recap {
  id?: string;
  userId: string;
  type: 'weekly' | 'monthly' | 'yearly';
  period: string;
  title: string;
  aiGenerated: {
    recapText: string;
    summary: string;
    keyMoments: string[];
    tone: string;
  };
  mediaEntries: Array<{
    content: string;
    date: Date;
    id: string;
    isFavorited: boolean;
    isMilestone: boolean;
    mediaCount: number;
  }>;
  dateRange: {
    start: Date;
    end: Date;
  };
  childIds: string[];
  likes: number;
  isFavorited: boolean;
  isMilestone: boolean;
  commentCount: number;
  generatedAt: Date;
  status: 'completed' | 'generating' | 'failed';
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
