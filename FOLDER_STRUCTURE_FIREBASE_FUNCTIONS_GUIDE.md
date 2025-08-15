# Folder Structure & Firebase Functions Guide - AI Recaps

## 📁 Recommended Folder Structure

### Complete Project Layout
```
SproutBook/
├── src/
│   ├── features/
│   │   └── recaps/
│   │       ├── screens/
│   │       │   ├── RecapsScreen.tsx
│   │       │   └── RecapDetailScreen.tsx
│   │       ├── components/
│   │       │   ├── RecapCard.tsx
│   │       │   ├── RecapGenerationControls.tsx
│   │       │   └── RecapShareModal.tsx
│   │       ├── services/
│   │       │   ├── recapService.ts
│   │       │   ├── openAIRecapService.ts
│   │       │   └── geminiRecapService.ts
│   │       └── hooks/
│   │           ├── useRecaps.ts
│   │           ├── useRecapGeneration.ts
│   │           └── useRecapSharing.ts
│   ├── services/
│   │   ├── ai/
│   │   │   ├── providers/
│   │   │   │   ├── OpenAIProvider.ts
│   │   │   │   └── GeminiProvider.ts
│   │   │   ├── types/
│   │   │   │   ├── AIResponse.ts
│   │   │   │   └── RecapTypes.ts
│   │   │   └── utils/
│   │   │       ├── promptBuilder.ts
│   │   │       └── responseParser.ts
│   │   └── firebase/
│   │       ├── recapsCollection.ts
│   │       └── aiJobsCollection.ts
│   └── config/
│       └── ai.config.ts
├── functions/                    # ← Firebase Cloud Functions
│   ├── index.js
│   ├── recaps/
│   │   ├── openaiGenerator.js
│   │   ├── geminiGenerator.js
│   │   └── scheduledJobs.js
│   ├── utils/
│   │   ├── firestoreHelpers.js
│   │   ├── promptTemplates.js
│   │   └── errorHandler.js
│   └── package.json
├── .env.local                    # ← Environment variables
├── firebase.json
└── firestore.rules
```

## 🏗️ Creating Firebase Functions

### Step 1: Initialize Firebase Functions
```bash
# From project root
cd SproutBook
firebase init functions

# Select JavaScript when prompted
# This creates the functions/ directory
```

### Step 2: Install Dependencies
```bash
cd functions
npm install firebase-functions@latest firebase-admin@latest
npm install openai@latest          # For OpenAI
npm install @google/generative-ai  # For Gemini
```

### Step 3: Create Functions Structure

**functions/index.js**
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Import individual functions
const generateOpenAIRecap = require('./recaps/openaiGenerator');
const generateGeminiRecap = require('./recaps/geminiGenerator');
const scheduledRecaps = require('./recaps/scheduledJobs');

// Export functions
exports.generateOpenAIRecap = generateOpenAIRecap;
exports.generateGeminiRecap = generateGeminiRecap;
exports.scheduledWeeklyRecaps = scheduledRecaps.weekly;
exports.scheduledMonthlyRecaps = scheduledRecaps.monthly;
```

## 🔧 Where Each Code Lives

### 1. AI Service Files (React Native)
```typescript
// Location: src/services/ai/providers/OpenAIProvider.ts
import OpenAI from 'openai';

export class OpenAIProvider {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateRecap(entries: JournalEntry[], type: string): Promise<AIResponse> {
    const prompt = this.buildRecapPrompt(entries, type);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a loving parent creating a beautiful memory recap..."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return this.parseResponse(response.choices[0].message.content);
  }

  private buildRecapPrompt(entries: JournalEntry[], type: string): string {
    return `Create a ${type} recap...`;
  }
}
```

### 2. Firebase Cloud Functions
```javascript
// Location: functions/recaps/openaiGenerator.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: functions.config().openai.key,
});

exports.generateOpenAIRecap = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, childId, type, startDate, endDate } = data;
  
  try {
    // Fetch journal entries from Firestore
    const entries = await fetchJournalEntries(userId, childId, startDate, endDate);
    
    // Generate AI content
    const aiResponse = await generateAIContent(entries, type);
    
    // Save to Firestore
    await saveRecap(userId, childId, type, entries, aiResponse, 'openai');
    
    return { success: true, data: aiResponse };
  } catch (error) {
    console.error('OpenAI generation error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate recap');
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

async function generateAIContent(entries, type) {
  const prompt = buildRecapPrompt(entries, type);
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a loving parent creating a beautiful memory recap..."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1000
  });

  return parseAIResponse(response.choices[0].message.content);
}
```

### 3. React Native Service Layer
```typescript
// Location: src/services/recapService.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/firebaseConfig';

export const recapService = {
  async generateRecap(params: GenerationParams) {
    const { provider, ...data } = params;
    
    const functionName = provider === 'openai' 
      ? 'generateOpenAIRecap' 
      : 'generateGeminiRecap';
    
    const generateFunction = httpsCallable(functions, functionName);
    
    try {
      const result = await generateFunction(data);
      return { success: true, data: result.data };
    } catch (error) {
      console.error(`${provider} generation failed:`, error);
      return { success: false, error: error.message };
    }
  }
};
```

## 🚀 How to Use Firebase Functions

### 1. Local Development
```bash
# Start Firebase emulator
firebase emulators:start --only functions

# Test function locally
curl -X POST http://localhost:5001/your-project/us-central1/generateOpenAIRecap \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","childId":"test","type":"weekly"}'
```

### 2. Deploy Functions
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:generateOpenAIRecap

# Deploy with environment variables
firebase functions:config:set openai.key="your-openai-key"
firebase functions:config:set gemini.key="your-gemini-key"
```

### 3. Call from React Native
```typescript
// Usage in React component
import { recapService } from '@/services/recapService';

const handleGenerateRecap = async () => {
  const result = await recapService.generateRecap({
    userId: user.uid,
    childId: selectedChild.id,
    type: 'weekly',
    provider: 'openai' // or 'gemini'
  });
  
  if (result.success) {
    console.log('Recap generated:', result.data);
  } else {
    console.error('Generation failed:', result.error);
  }
};
```

## 📋 Complete File Creation Checklist

### Create These Files:

**React Native Files:**
```
src/services/ai/providers/OpenAIProvider.ts
src/services/ai/providers/GeminiProvider.ts
src/services/recapService.ts
src/features/recaps/services/recapService.ts
src/config/ai.config.ts
```

**Firebase Functions:**
```
functions/index.js
functions/recaps/openaiGenerator.js
functions/recaps/geminiGenerator.js
functions/recaps/scheduledJobs.js
functions/utils/firestoreHelpers.js
functions/utils/promptTemplates.js
```

**Configuration Files:**
```
.env.local (for local development)
firebase.json (functions configuration)
firestore.rules (security rules)
```

## 🔍 Quick Verification Commands

```bash
# Check functions directory
ls -la functions/

# Verify Firebase config
firebase functions:config:get

# Test function deployment
firebase functions:shell
> generateOpenAIRecap({userId: "test", childId: "test", type: "weekly"})
```

This structure provides clear separation of concerns, making it easy to maintain and extend the AI recap functionality for both OpenAI and Gemini implementations.
