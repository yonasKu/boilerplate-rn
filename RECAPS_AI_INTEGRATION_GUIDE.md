# Recaps AI Integration Guide - SproutBook

## Overview
This guide details how to implement AI-powered weekly, monthly, and yearly memory recaps using ChatGPT/OpenAI integration. The system will automatically generate beautiful memory compilations from journal entries with AI-generated summaries, highlight photos, and exportable formats.

## Firebase & AI Integration Architecture

### 1. Firestore Collections Structure

#### Recaps Collection
```
collection: recaps
├── recapId (string)
├── userId (string)
├── childId (string)
├── type (string: "weekly" | "monthly" | "yearly")
├── period (object)
│   ├── startDate (timestamp)
│   ├── endDate (timestamp)
│   └── displayName (string: "Week of Jan 1-7, 2024")
├── aiGenerated (object)
│   ├── summary (string) - AI-generated narrative
│   ├── title (string) - AI-generated title
│   ├── keyMoments (array) - Top 3-5 moments
│   └── sentiment (object)
│       ├── overall (string: "joyful" | "nostalgic" | "mixed" | "challenging")
│       └── score (number: -1 to 1)
├── media (object)
│   ├── highlightPhotos (array of photo URLs)
│   ├── galleryUrl (string) - Generated gallery
│   └── videoUrl (string) - Generated video recap
├── tags (array of strings: ["milestone", "favorite", "growth", "special"])
├── status (string: "generating" | "completed" | "failed")
├── exportData (object)
│   ├── textContent (string)
│   ├── photoUrls (array)
│   └── shareableUrl (string)
├── createdAt (timestamp)
├── generatedAt (timestamp)
└── updatedAt (timestamp)
```

#### AIProcessingJobs Collection (for async processing)
```
collection: aiProcessingJobs
├── jobId (string)
├── recapId (string)
├── userId (string)
├── type (string: "recap_generation")
├── status (string: "pending" | "processing" | "completed" | "failed")
├── inputData (object)
│   ├── journalEntries (array)
│   ├── childInfo (object)
│   └── preferences (object)
├── outputData (object) - AI response
├── error (string, nullable)
├── createdAt (timestamp)
├── startedAt (timestamp, nullable)
└── completedAt (timestamp, nullable)
```

### 2. OpenAI Integration Setup

#### Environment Variables
```bash
# Add to your environment configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
```

#### Cloud Functions for AI Processing
Create `functions/recapsAI.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: functions.config().openai.key,
});

// Main function to generate recap
exports.generateRecap = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, childId, type, startDate, endDate } = data;
  
  try {
    // 1. Fetch journal entries for period
    const journalEntries = await fetchJournalEntries(userId, childId, startDate, endDate);
    
    if (journalEntries.length === 0) {
      throw new functions.https.HttpsError('not-found', 'No journal entries found for this period');
    }

    // 2. Create AI processing job
    const jobId = await createAIProcessingJob(userId, childId, type, journalEntries);
    
    // 3. Process AI generation asynchronously
    processRecapGeneration(jobId, userId, childId, type, journalEntries);
    
    return { jobId, status: 'processing' };
    
  } catch (error) {
    console.error('Error generating recap:', error);
    throw new functions.https.HttpsError('internal', 'Failed to start recap generation');
  }
});

async function fetchJournalEntries(userId, childId, startDate, endDate) {
  const entriesQuery = await admin.firestore()
    .collection('journalEntries')
    .where('userId', '==', userId)
    .where('childId', '==', childId)
    .where('date', '>=', new Date(startDate))
    .where('date', '<=', new Date(endDate))
    .orderBy('date', 'asc')
    .get();

  return entriesQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date.toDate()
  }));
}

async function createAIProcessingJob(userId, childId, type, journalEntries) {
  const jobId = admin.firestore().collection('aiProcessingJobs').doc().id;
  
  await admin.firestore().collection('aiProcessingJobs').doc(jobId).set({
    jobId,
    userId,
    childId,
    type: 'recap_generation',
    status: 'pending',
    inputData: {
      journalEntries,
      childInfo: await getChildInfo(childId),
      preferences: await getUserPreferences(userId)
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return jobId;
}

async function processRecapGeneration(jobId, userId, childId, type, journalEntries) {
  try {
    // Update job status
    await admin.firestore().collection('aiProcessingJobs').doc(jobId).update({
      status: 'processing',
      startedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Generate AI content
    const aiResponse = await generateAIRecapContent(journalEntries, type);
    
    // Create recap document
    const recapId = await createRecapDocument(userId, childId, type, journalEntries, aiResponse);
    
    // Update job completion
    await admin.firestore().collection('aiProcessingJobs').doc(jobId).update({
      status: 'completed',
      outputData: { recapId, aiResponse },
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    console.error('Error in recap generation:', error);
    await admin.firestore().collection('aiProcessingJobs').doc(jobId).update({
      status: 'failed',
      error: error.message,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

async function generateAIRecapContent(journalEntries, type) {
  const prompt = buildRecapPrompt(journalEntries, type);
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a loving parent creating a beautiful memory recap of your child's growth and special moments. Generate warm, nostalgic, and meaningful summaries that capture the essence of this time period."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 1000
  });

  const aiContent = response.choices[0].message.content;
  
  // Parse AI response
  return parseAIResponse(aiContent, journalEntries);
}

function buildRecapPrompt(entries, type) {
  const entrySummaries = entries.map(entry => 
    `Date: ${entry.date.toDateString()}\n` +
    `Mood: ${entry.mood || 'N/A'}\n` +
    `Content: ${entry.content.substring(0, 200)}${entry.content.length > 200 ? '...' : ''}\n` +
    `Photos: ${entry.photos?.length || 0}\n---`
  ).join('\n');

  return `
Create a ${type} recap for my child's memories based on these journal entries:

${entrySummaries}

Please provide:
1. A beautiful, nostalgic title that captures the essence of this period
2. A warm, detailed summary (3-4 paragraphs) that tells the story of this time
3. 3-5 key moments or milestones that stood out
4. Overall sentiment (joyful, nostalgic, mixed, challenging) with a score from -1 to 1
5. Suggested tags for this recap (milestone, favorite, growth, special, etc.)

Make it personal, warm, and meaningful. Focus on growth, special moments, and the love captured in these memories.
`;
}

function parseAIResponse(content, entries) {
  // Parse the AI response into structured data
  // This is a simplified parser - you may want to use JSON mode or more sophisticated parsing
  const lines = content.split('\n');
  
  return {
    title: extractTitle(lines),
    summary: extractSummary(lines),
    keyMoments: extractKeyMoments(lines),
    sentiment: extractSentiment(lines),
    tags: extractTags(lines)
  };
}
```

### 3. Scheduled Recap Generation

#### Cloud Scheduler Function
Create `functions/scheduledRecaps.js`:

```javascript
// Scheduled function to generate weekly recaps
exports.generateWeeklyRecaps = functions.pubsub
  .schedule('0 9 * * 0') // Every Sunday at 9 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    
    const usersSnapshot = await admin.firestore().collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const children = userDoc.data().children || [];
      
      for (const childId of children) {
        await generateWeeklyRecapForChild(userId, childId);
      }
    }
    
    console.log('Weekly recap generation completed');
  });

async function generateWeeklyRecapForChild(userId, childId) {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Check if recap already exists for this week
  const existingRecap = await admin.firestore()
    .collection('recaps')
    .where('userId', '==', userId)
    .where('childId', '==', childId)
    .where('type', '==', 'weekly')
    .where('period.startDate', '==', weekStart)
    .limit(1)
    .get();
  
  if (!existingRecap.empty) {
    return; // Skip if already generated
  }
  
  // Trigger AI generation
  const generateRecap = httpsCallable(functions, 'generateRecap');
  await generateRecap({
    userId,
    childId,
    type: 'weekly',
    startDate: weekStart.toISOString(),
    endDate: now.toISOString()
  });
}

// Similar functions for monthly and yearly recaps
exports.generateMonthlyRecaps = functions.pubsub
  .schedule('0 9 1 * *') // 1st of every month at 9 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    // Implementation similar to weekly
  });

exports.generateYearlyRecaps = functions.pubsub
  .schedule('0 9 1 1 *') // January 1st at 9 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    // Implementation similar to weekly
  });
```

### 4. Client-Side Implementation

#### Recap Service
Create `src/services/recapService.ts`:

```typescript
import { firebase } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  getDoc 
} from 'firebase/firestore';

export interface Recap {
  recapId: string;
  userId: string;
  childId: string;
  type: 'weekly' | 'monthly' | 'yearly';
  period: {
    startDate: Date;
    endDate: Date;
    displayName: string;
  };
  aiGenerated: {
    summary: string;
    title: string;
    keyMoments: string[];
    sentiment: {
      overall: string;
      score: number;
    };
  };
  media: {
    highlightPhotos: string[];
    galleryUrl?: string;
    videoUrl?: string;
  };
  tags: string[];
  status: 'generating' | 'completed' | 'failed';
  createdAt: Date;
  generatedAt: Date;
}

export class RecapService {
  private functions = firebase.functions();
  private db = firebase.firestore();

  async generateRecap(userId: string, childId: string, type: string, startDate: Date, endDate: Date): Promise<string> {
    const generateRecap = httpsCallable(this.functions, 'generateRecap');
    const result = await generateRecap({
      userId,
      childId,
      type,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    return result.data.jobId;
  }

  async getRecaps(userId: string, childId: string, limitCount: number = 10): Promise<Recap[]> {
    const recapsQuery = query(
      collection(this.db, 'recaps'),
      where('userId', '==', userId),
      where('childId', '==', childId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(recapsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      generatedAt: doc.data().generatedAt?.toDate(),
      period: {
        ...doc.data().period,
        startDate: doc.data().period?.startDate?.toDate(),
        endDate: doc.data().period?.endDate?.toDate()
      }
    } as Recap));
  }

  async getRecapById(recapId: string): Promise<Recap | null> {
    const recapDoc = await getDoc(doc(this.db, 'recaps', recapId));
    if (!recapDoc.exists()) return null;
    
    return {
      id: recapDoc.id,
      ...recapDoc.data(),
      createdAt: recapDoc.data().createdAt?.toDate(),
      generatedAt: recapDoc.data().generatedAt?.toDate()
    } as Recap;
  }

  async getRecapsByType(userId: string, childId: string, type: string): Promise<Recap[]> {
    const recapsQuery = query(
      collection(this.db, 'recaps'),
      where('userId', '==', userId),
      where('childId', '==', childId),
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(recapsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      generatedAt: doc.data().generatedAt?.toDate()
    } as Recap));
  }
}
```

### 5. UI Components for Recaps

#### Recaps Timeline Screen
Create `src/features/recaps/screens/RecapsScreen.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { RecapService } from '../../../services/recapService';
import { useAuth } from '../../../context/AuthContext';
import { useChildContext } from '../../../context/ChildContext';

const RecapsScreen = () => {
  const { user } = useAuth();
  const { selectedChild } = useChildContext();
  const [recaps, setRecaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const recapService = new RecapService();

  useEffect(() => {
    if (user && selectedChild) {
      loadRecaps();
    }
  }, [user, selectedChild]);

  const loadRecaps = async () => {
    try {
      const recapData = await recapService.getRecaps(user.uid, selectedChild.id);
      setRecaps(recapData);
    } catch (error) {
      console.error('Error loading recaps:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecaps();
  };

  const renderRecapItem = ({ item }) => (
    <TouchableOpacity style={styles.recapCard}>
      <View style={styles.recapHeader}>
        <Text style={styles.recapTitle}>{item.aiGenerated.title}</Text>
        <Text style={styles.recapPeriod}>{item.period.displayName}</Text>
      </View>
      
      {item.media.highlightPhotos.length > 0 && (
        <View style={styles.photoGrid}>
          {item.media.highlightPhotos.slice(0, 3).map((photo, index) => (
            <Image 
              key={index} 
              source={{ uri: photo }} 
              style={styles.highlightPhoto}
            />
          ))}
        </View>
      )}
      
      <Text style={styles.recapSummary} numberOfLines={3}>
        {item.aiGenerated.summary}
      </Text>
      
      <View style={styles.recapFooter}>
        <View style={styles.tagsContainer}>
          {item.tags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.recapDate}>
          {item.generatedAt.toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recaps}
        renderItem={renderRecapItem}
        keyExtractor={item => item.recapId}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No recaps yet. Your first recap will be generated soon!
            </Text>
          </View>
        }
      />
    </View>
  );
};
```

### 6. Export & Sharing Features

#### Export Service
Create `src/services/exportService.ts`:

```typescript
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

export class ExportService {
  async exportRecapAsGallery(recap: Recap): Promise<void> {
    // Create shareable gallery with photos and text
    const shareData = {
      title: recap.aiGenerated.title,
      message: recap.aiGenerated.summary,
      photos: recap.media.highlightPhotos
    };

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(shareData);
    }
  }

  async exportRecapAsVideo(recap: Recap): Promise<string> {
    // Generate video slideshow with photos and text overlay
    // This would integrate with a video generation service
    const videoUrl = await this.generateVideo(recap);
    return videoUrl;
  }

  async shareRecap(recap: Recap, method: 'sms' | 'email' | 'social'): Promise<void> {
    const shareText = `${recap.aiGenerated.title}\n\n${recap.aiGenerated.summary}\n\nShared from SproutBook`;
    
    switch (method) {
      case 'sms':
        // Use expo-sms
        break;
      case 'email':
        // Use expo-mail-composer
        break;
      case 'social':
        await Sharing.shareAsync({
          message: shareText,
          url: recap.media.galleryUrl
        });
        break;
    }
  }

  private async generateVideo(recap: Recap): Promise<string> {
    // Implementation for video generation
    // This would use a service like Cloudinary or AWS Elemental
    return 'video-url-placeholder';
  }
}
```

### 7. AI Prompt Templates

#### Weekly Recap Prompt
```
Create a warm, nostalgic weekly recap for a child's memories based on these journal entries:

[Journal Entries]

Please provide:
1. A beautiful title that captures the essence of this week
2. A 3-4 paragraph summary that tells the story of this week
3. 3-5 key moments that stood out
4. Overall sentiment (joyful, nostalgic, mixed, challenging)
5. Suggested tags

Focus on growth, special moments, and the love in these memories.
```

#### Monthly Recap Prompt
```
Create a comprehensive monthly recap that captures the major themes and growth of this month:

[Journal Entries]

Please provide:
1. A meaningful title for this month
2. A detailed 4-5 paragraph summary covering major developments
3. Top 5-7 moments that defined this month
4. Growth milestones observed
5. Sentiment analysis
6. Photo selection suggestions
```

#### Yearly Recap Prompt
```
Create a beautiful yearly recap that tells the complete story of this year:

[Journal Entries]

Please provide:
1. A heartfelt title for this year
2. A comprehensive 6-8 paragraph summary
3. Major milestones and achievements
4. Growth journey narrative
5. Most memorable moments
6. Looking forward message
7. Photo highlights selection
```

### 8. Testing Checklist

- [ ] AI integration with OpenAI API
- [ ] Journal entry data fetching
- [ ] Recap generation for different time periods
- [ ] Photo selection and highlight generation
- [ ] Export functionality (gallery, video)
- [ ] Sharing via SMS, email, social media
- [ ] Timeline browsing with filters
- [ ] Tagging system
- [ ] Scheduled generation (weekly/monthly/yearly)
- [ ] Error handling and retry mechanisms
- [ ] Performance optimization for large datasets

### 9. Performance Optimization

#### Data Processing
- Batch processing for large datasets
- Caching frequently accessed data
- Pagination for timeline browsing
- Lazy loading for photos

#### AI Optimization
- Rate limiting for API calls
- Retry logic with exponential backoff
- Fallback to cached content when offline
- Background processing for scheduled recaps

### 10. Migration Strategy

For existing journal entries:
1. **Backfill recaps** for historical data
2. **Generate initial recaps** for recent periods
3. **Update user preferences** for AI customization
4. **Set up scheduled generation** for future recaps

```javascript
// Migration function for existing data
exports.backfillRecaps = functions.https.onRequest(async (req, res) => {
  const usersSnapshot = await admin.firestore().collection('users').get();
  
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const children = userDoc.data().children || [];
    
    for (const childId of children) {
      // Generate recaps for past periods
      await generateHistoricalRecaps(userId, childId);
    }
  }
  
  res.send('Historical recap generation completed');
});
```

## Next Steps
1. Set up OpenAI API integration
2. Deploy Cloud Functions for processing
3. Create recap service and UI components
4. Implement export and sharing features
5. Test AI generation with sample data
6. Set up scheduled generation
7. Add analytics tracking for recap engagement
