# AI Recaps Backend Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the complete AI-powered recap generation system for SproutBook. We'll build the backend pipeline that generates weekly, monthly, and yearly recaps using OpenAI.

## Phase 1: Environment Setup & Dependencies

### 1.1 Environment Variables
Create `.env` file in `functions/` directory:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
MAX_TOKENS=2000
TEMPERATURE=0.7

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com

# Service Configuration
MAX_RECAP_LENGTH=500
MAX_PHOTOS_PER_RECAP=5
GENERATION_TIMEOUT=30000
```

### 1.2 Install Dependencies
```bash
cd functions
npm install openai@^4.0.0
npm install date-fns@^2.30.0
npm install sharp@^0.32.0  # For image processing
npm install node-cron@^3.0.0  # For scheduling
```

## Phase 2: Journal Entry Aggregation Service

### 2.1 Service Structure
Create `functions/services/journalAggregator.js`:

```javascript
const { db } = require('../firebaseAdmin');
const { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } = require('date-fns');

class JournalAggregator {
  constructor() {
    this.db = db;
  }

  /**
   * Fetch journal entries for recap generation
   * @param {Object} params - Query parameters
   * @param {string} params.userId - User ID
   * @param {string} params.childId - Child ID
   * @param {string} params.type - Recap type (weekly/monthly/yearly)
   * @param {Date} params.startDate - Period start date
   * @param {Date} params.endDate - Period end date
   * @returns {Promise<Object>} Aggregated journal data
   */
  async aggregateJournalEntries({ userId, childId, type, startDate, endDate }) {
    try {
      // Build Firestore query
      let query = this.db.collection('journalEntries')
        .where('userId', '==', userId)
        .where('childIds', 'array-contains', childId)
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .orderBy('createdAt', 'desc');

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        return {
          entries: [],
          totalEntries: 0,
          moodSummary: {},
          activitySummary: {},
          photos: [],
          keyMoments: []
        };
      }

      const entries = [];
      const moodCounts = {};
      const activityCounts = {};
      const photos = [];
      const keyMoments = [];

      snapshot.forEach(doc => {
        const entry = doc.data();
        entries.push({
          id: doc.id,
          ...entry,
          createdAt: entry.createdAt.toDate(),
          updatedAt: entry.updatedAt.toDate()
        });

        // Aggregate mood data
        if (entry.mood) {
          moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        }

        // Aggregate activity data
        if (entry.activities) {
          entry.activities.forEach(activity => {
            activityCounts[activity] = (activityCounts[activity] || 0) + 1;
          });
        }

        // Collect photos
        if (entry.photos && entry.photos.length > 0) {
          photos.push(...entry.photos);
        }

        // Extract key moments from content
        if (entry.content && entry.content.length > 100) {
          keyMoments.push({
            date: entry.createdAt,
            summary: entry.content.substring(0, 100) + '...',
            photos: entry.photos || []
          });
        }
      });

      return {
        entries,
        totalEntries: entries.length,
        moodSummary: moodCounts,
        activitySummary: activityCounts,
        photos: this.selectBestPhotos(photos, 5), // Select top 5 photos
        keyMoments: keyMoments.slice(0, 3), // Top 3 moments
        dateRange: { start: startDate, end: endDate }
      };
    } catch (error) {
      console.error('Error aggregating journal entries:', error);
      throw new Error(`Failed to aggregate journal entries: ${error.message}`);
    }
  }

  /**
   * Select best photos for recap highlights
   * @param {Array} photos - Array of photo URLs
   * @param {number} maxPhotos - Maximum photos to select
   * @returns {Array} Selected photo URLs
   */
  selectBestPhotos(photos, maxPhotos) {
    if (!photos || photos.length === 0) return [];
    
    // For now, return first N photos
    // TODO: Implement AI-based photo selection based on quality, relevance, diversity
    return photos.slice(0, maxPhotos);
  }

  /**
   * Calculate date ranges for different recap types
   * @param {string} type - Recap type
   * @param {Date} referenceDate - Reference date
   * @returns {Object} Date range object
   */
  calculateDateRange(type, referenceDate = new Date()) {
    switch (type) {
      case 'weekly':
        return {
          start: startOfWeek(referenceDate, { weekStartsOn: 1 }),
          end: endOfWeek(referenceDate, { weekStartsOn: 1 })
        };
      case 'monthly':
        return {
          start: startOfMonth(referenceDate),
          end: endOfMonth(referenceDate)
        };
      case 'yearly':
        return {
          start: startOfYear(referenceDate),
          end: endOfYear(referenceDate)
        };
      default:
        throw new Error(`Invalid recap type: ${type}`);
    }
  }
}

module.exports = JournalAggregator;
```

## Phase 3: OpenAI Integration Service

### 3.1 OpenAI Service
Create `functions/services/openAIService.js`:

```javascript
const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    this.maxTokens = parseInt(process.env.MAX_TOKENS) || 2000;
    this.temperature = parseFloat(process.env.TEMPERATURE) || 0.7;
  }

  /**
   * Generate recap content using OpenAI
   * @param {Object} journalData - Aggregated journal data
   * @param {string} type - Recap type (weekly/monthly/yearly)
   * @returns {Promise<Object>} Generated recap content
   */
  async generateRecap(journalData, type) {
    try {
      const prompt = this.buildPrompt(journalData, type);
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a helpful parenting assistant creating ${type} recaps for a baby journal app. Create warm, engaging summaries that capture special moments and developmental milestones. Focus on emotional connections and meaningful experiences.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const content = response.choices[0].message.content;
      return this.parseGeneratedContent(content);
    } catch (error) {
      console.error('Error generating recap:', error);
      throw new Error(`Failed to generate recap: ${error.message}`);
    }
  }

  /**
   * Build prompt for OpenAI by analyzing journal text content
   * @param {Object} data - Aggregated journal data with entries
   * @param {string} type - Recap type (weekly/monthly/yearly)
   * @returns {string} Formatted prompt for text analysis
   */
  buildPrompt(data, type) {
    const { entries, totalEntries, photos } = data;
    
    // Format journal entries for AI analysis
    const entriesText = entries.map(entry => 
      `- ${entry.createdAt.toDateString()}: ${entry.content || 'No content provided'}`
    ).join('\n');

    return `Analyze these journal entries and create a ${type} recap:

**Journal Entries (${totalEntries} total):**
${entriesText}

**Available Photos:** ${photos.length} photos attached

**Your Task:**
1. Read each journal entry carefully
2. Identify the emotional tone (happy, tired, excited, challenging moments)
3. Extract specific activities mentioned (feeding, playtime, milestones, etc.)
4. Find memorable moments and achievements
5. Create a warm, personal summary as if written by a parent

**Requirements:**
- Write in a warm, personal, parent voice
- Include specific details found in the text
- Highlight developmental milestones mentioned
- Capture emotional connections and growth
- Keep it concise but meaningful
- Structure as valid JSON

**Output format:**
{
  "title": "A meaningful title based on content",
  "summary": "Overall summary paragraph capturing the period's essence",
  "keyMoments": [
    {
      "moment": "Specific memorable moment from text",
      "significance": "Why this was special based on context"
    }
  ]
}`;
  }

  /**
   * Parse generated content from OpenAI response
   * @param {string} content - Raw content from OpenAI
   * @returns {Object} Parsed content object
   */
  parseGeneratedContent(content) {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || 'Weekly Recap',
        summary: parsed.summary || '',
        keyMoments: parsed.keyMoments || []
      };
    } catch (error) {
      // Fallback to text parsing
      const lines = content.split('\n').filter(line => line.trim());
      return {
        title: lines[0]?.replace(/^#\s*/, '') || 'Weekly Recap',
        summary: lines.slice(1).join(' '),
        keyMoments: []
      };
    }
  }
}

module.exports = OpenAIService;
```

## Phase 4: Recap Generation Pipeline

### 4.1 Recap Generator Service
Create `functions/services/recapGenerator.js`:

```javascript
const JournalAggregator = require('./journalAggregator');
const OpenAIService = require('./openAIService');
const { db } = require('../firebaseAdmin');

class RecapGenerator {
  constructor() {
    this.journalAggregator = new JournalAggregator();
    this.openAIService = new OpenAIService();
  }

  /**
   * Generate a recap for a specific period
   * @param {Object} params - Generation parameters
   * @param {string} params.userId - User ID
   * @param {string} params.childId - Child ID
   * @param {string} params.type - Recap type
   * @param {Date} params.date - Reference date for period
   */
  async generateRecap({ userId, childId, type, date = new Date() }) {
    try {
      console.log(`Starting ${type} recap generation for user ${userId}, child ${childId}`);

      // Calculate date range
      const dateRange = this.journalAggregator.calculateDateRange(type, date);
      
      // Create recap record with 'generating' status
      const recapId = await this.createRecapRecord(userId, childId, type, dateRange);

      // Aggregate journal entries
      const journalData = await this.journalAggregator.aggregateJournalEntries({
        userId,
        childId,
        type,
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      if (journalData.totalEntries === 0) {
        await this.updateRecapStatus(recapId, 'completed', {
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Recap`,
          summary: 'No journal entries found for this period.',
          keyMoments: []
        });
        return;
      }

      // Generate AI content
      const aiContent = await this.openAIService.generateRecap(journalData, type);

      // Update recap with generated content
      await this.updateRecapStatus(recapId, 'completed', {
        ...aiContent,
        media: {
          highlightPhotos: journalData.photos
        }
      });

      console.log(`Successfully generated ${type} recap: ${recapId}`);
    } catch (error) {
      console.error(`Error generating ${type} recap:`, error);
      
      // Update recap with error status
      if (recapId) {
        await this.updateRecapStatus(recapId, 'failed', {
          error: error.message
        });
      }
      throw error;
    }
  }

  /**
   * Create initial recap record
   */
  async createRecapRecord(userId, childId, type, dateRange) {
    const recapRef = await db.collection('recaps').add({
      userId,
      childId,
      type,
      period: {
        startDate: dateRange.start,
        endDate: dateRange.end
      },
      aiGenerated: {
        title: '',
        summary: '',
        keyMoments: []
      },
      media: {
        highlightPhotos: []
      },
      status: 'generating',
      createdAt: new Date(),
      generatedAt: new Date()
    });

    return recapRef.id;
  }

  /**
   * Update recap status and content
   */
  async updateRecapStatus(recapId, status, content = {}) {
    const updateData = {
      status,
      generatedAt: new Date()
    };

    if (status === 'completed') {
      updateData.aiGenerated = content;
      if (content.media) {
        updateData.media = content.media;
      }
    } else if (status === 'failed') {
      updateData.error = content.error;
    }

    await db.collection('recaps').doc(recapId).update(updateData);
  }
}

module.exports = RecapGenerator;
```

## Phase 5: Scheduled Generation Triggers

### 5.1 Cloud Functions for Scheduling
Create `functions/recapScheduler.js`:

```javascript
const functions = require('firebase-functions');
const RecapGenerator = require('./services/recapGenerator');

const recapGenerator = new RecapGenerator();

/**
 * Scheduled function to generate weekly recaps
 * Runs every Sunday at 11:59 PM
 */
exports.generateWeeklyRecaps = functions.pubsub
  .schedule('59 23 * * 0') // Every Sunday at 23:59
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Starting weekly recap generation');
    await generateRecapsForAllUsers('weekly');
  });

/**
 * Scheduled function to generate monthly recaps
 * Runs on the last day of each month at 11:59 PM
 */
exports.generateMonthlyRecaps = functions.pubsub
  .schedule('59 23 L * *') // Last day of month at 23:59
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Starting monthly recap generation');
    await generateRecapsForAllUsers('monthly');
  });

/**
 * Scheduled function to generate yearly recaps
 * Runs on December 31st at 11:59 PM
 */
exports.generateYearlyRecaps = functions.pubsub
  .schedule('59 23 31 12 *') // December 31st at 23:59
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Starting yearly recap generation');
    await generateRecapsForAllUsers('yearly');
  });

/**
 * Generate recaps for all active users and their children
 */
async function generateRecapsForAllUsers(type) {
  try {
    const usersSnapshot = await db.collection('users').get();
    
    const promises = [];
    usersSnapshot.forEach(async (userDoc) => {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Get user's children
      const childrenSnapshot = await db.collection('children')
        .where('userId', '==', userId)
        .get();
      
      childrenSnapshot.forEach(childDoc => {
        const childId = childDoc.id;
        promises.push(
          recapGenerator.generateRecap({
            userId,
            childId,
            type
          })
        );
      });
    });

    await Promise.all(promises);
    console.log(`Completed ${type} recap generation for all users`);
  } catch (error) {
    console.error(`Error generating ${type} recaps:`, error);
  }
}

/**
 * Manual trigger function for testing
 */
exports.triggerManualRecap = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { childId, type, date } = data;
  
  if (!childId || !type) {
    throw new functions.https.HttpsError('invalid-argument', 'childId and type are required');
  }

  try {
    await recapGenerator.generateRecap({
      userId: context.auth.uid,
      childId,
      type,
      date: date ? new Date(date) : new Date()
    });

    return { success: true, message: `${type} recap generation started` };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

## Phase 6: Deployment & Testing

### 6.1 Deploy Functions
```bash
cd functions
firebase deploy --only functions
```

### 6.2 Test Manual Trigger
```javascript
// Test from frontend
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const triggerManualRecap = httpsCallable(functions, 'triggerManualRecap');

await triggerManualRecap({
  childId: 'child123',
  type: 'weekly'
});
```

## Phase 7: Monitoring & Error Handling

### 7.1 Add Logging
All services include comprehensive logging for debugging and monitoring.

### 7.2 Error Handling
- Retry mechanisms for failed AI calls
- Graceful degradation when no journal entries exist
- Proper error propagation to frontend

## Next Steps
After implementing this guide:
1. Test manual recap generation
2. Verify scheduled triggers work
3. Monitor AI usage and costs
4. Fine-tune prompts for better results
5. Add frontend display components
