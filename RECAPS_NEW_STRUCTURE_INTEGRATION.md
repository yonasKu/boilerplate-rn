# AI Recaps New Structure Integration Guide

## Overview
This guide documents how to migrate the codebase to use the new AI recap structure based on the provided Firestore document format.

## Current Structure vs New Structure

### Current Structure (Legacy)
```typescript
interface LegacyRecap {
  id?: string;
  userId: string;
  childId: string;
  type: 'weekly' | 'monthly' | 'yearly';
  period: {
    startDate: Date;
    endDate: Date;
  };
  aiGenerated: {
    title?: string;
    summary?: string;
    keyMoments?: string[];
    recapText?: string;
    tone?: string;
  };
  media?: {
    highlightPhotos: string[];
  };
  status: 'generating' | 'completed' | 'failed';
  createdAt: Date;
  generatedAt: Date;
}
```

### New Structure (Current Firestore)
```typescript
interface NewRecap {
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
```

## Required Code Changes

### 1. Update Type Definitions
**File: `src/features/recaps/types/recap.ts`**
```typescript
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
```

### 2. Update Firestore Data Mapping
**File: `src/features/recaps/hooks/useRecaps.ts`**

Replace the data mapping section:

```typescript
const mappedRecap: Recap = {
  id: doc.id,
  userId: data.userId,
  type: data.type,
  period: data.period || `${data.type} recap`,
  title: data.title || `Your child's ${data.type}`,
  aiGenerated: {
    recapText: data.aiGenerated?.recapText || '',
    summary: data.aiGenerated?.summary || '',
    keyMoments: data.aiGenerated?.keyMoments || [],
    tone: data.aiGenerated?.tone || 'neutral',
  },
  mediaEntries: data.mediaEntries || [],
  dateRange: {
    start: data.dateRange?.start?.toDate() || new Date(),
    end: data.dateRange?.end?.toDate() || new Date(),
  },
  childIds: data.childIds || [data.childId],
  likes: data.likes || 0,
  isFavorited: data.isFavorited || false,
  isMilestone: data.isMilestone || false,
  commentCount: data.commentCount || 0,
  generatedAt: data.generatedAt?.toDate() || new Date(),
  status: data.status || 'completed',
};
```

### 3. Update Component Usage

#### **File: `src/features/recaps/components/RecapCard.tsx`**

Update imports and usage:
```typescript
// Change import
import { Recap } from '@/features/recaps/types/recap';

// Update usage patterns
const title = recap.title;
const recapText = recap.aiGenerated.recapText;
const mediaEntries = recap.mediaEntries;

// Update date formatting
const formattedDate = {
  line1: recap.period.toUpperCase(),
  line2: recap.dateRange.start.toLocaleDateString('en-US', { month: 'long' }).toUpperCase(),
  line3: recap.dateRange.start.getDate(),
  line4: recap.dateRange.start.getFullYear(),
};
```

#### **File: `src/features/recaps/screens/RecapsScreen.tsx`**

Update filtering logic:
```typescript
// Update filtering to use childIds array
const filteredRecaps = React.useMemo(() => {
  if (!rawRecaps) return [];
  
  let filtered = rawRecaps;
  
  // Filter by selected child
  if (selectedChild && selectedChild !== 'all') {
    filtered = filtered.filter(recap => 
      recap.childIds.includes(selectedChild)
    );
  }
  
  // Rest of filtering logic remains similar
  return filtered;
}, [rawRecaps, selectedChild, activeTimeline, activeFilter]);
```

### 4. Update Service Files

#### **File: `src/services/aiRecapService.ts`**

Update the Recap interface to match the new structure:
```typescript
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
```

### 5. Handle Data Migration

#### **Migration Script (Optional)**
```typescript
// Run this once to migrate existing data
const migrateLegacyRecaps = async () => {
  const legacyRecaps = await getLegacyRecaps();
  
  for (const legacy of legacyRecaps) {
    const newRecap = {
      userId: legacy.userId,
      type: legacy.type,
      period: `${legacy.type} recap`,
      title: legacy.aiGenerated?.title || `${legacy.type} recap`,
      aiGenerated: {
        recapText: legacy.aiGenerated?.recapText || legacy.aiGenerated?.summary || '',
        summary: legacy.aiGenerated?.summary || '',
        keyMoments: legacy.aiGenerated?.keyMoments || [],
        tone: legacy.aiGenerated?.tone || 'neutral',
      },
      mediaEntries: [], // Populate from legacy media
      dateRange: {
        start: legacy.period.startDate,
        end: legacy.period.endDate,
      },
      childIds: [legacy.childId],
      likes: 0,
      isFavorited: false,
      isMilestone: false,
      commentCount: 0,
      generatedAt: legacy.generatedAt,
      status: legacy.status,
    };
    
    await addDoc(collection(db, 'recaps'), newRecap);
  }
};
```

### 6. Update Firestore Security Rules

**File: `firestore.rules`**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /recaps/{recapId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Testing Checklist

- [ ] Verify Firestore documents load correctly
- [ ] Check that all fields are properly mapped
- [ ] Test filtering by child IDs
- [ ] Verify media entries display correctly
- [ ] Test likes, favorites, and milestones functionality
- [ ] Check date formatting displays correctly
- [ ] Verify AI-generated content renders properly

## Common Issues & Solutions

### Issue: TypeScript errors about missing fields
**Solution**: Ensure all fields have default values in the mapping function.

### Issue: Media entries not displaying
**Solution**: Check that mediaEntries array is properly populated and mapped.

### Issue: Child filtering not working
**Solution**: Verify childIds array contains correct child IDs and filtering logic uses includes().

### Issue: Date formatting errors
**Solution**: Ensure dateRange fields are properly converted from Firestore Timestamps to JavaScript Dates.

## Verification Steps

1. Check Firestore console for correct document structure
2. Verify console.log outputs in useRecaps hook show correct data
3. Test UI components display all data correctly
4. Verify filtering and sorting work as expected
5. Check error handling for missing optional fields
