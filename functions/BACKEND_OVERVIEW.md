# SproutBook Backend - Complete System Overview

Sproutbook-Backend/
├── services/           # Core business logic
├── recaps/            # Scheduled automation functions
├── scheduled/         # Reminder functions
├── test/             # Testing and demos
├── utils/            # Environment validation
├── firebaseAdmin.js  # Firebase initialization
├── index.js          # Cloud functions entry point
└── firestore.rules   # Database security rules

## 🎯 What This Backend Does

The SproutBook backend is a comprehensive **parent-focused journaling and memory preservation system** that combines AI-powered content generation with intelligent push notifications. Here's everything it does:

## 🏗️ Core Features

### 1. AI-Powered Recap Generation
- **Weekly Recaps**: AI generates weekly summaries of your child's moments
- **Monthly Recaps**: AI creates monthly milestone summaries  
- **Yearly Recaps**: AI produces yearly growth and memory compilations
- **Parent Voice**: All recaps written in warm, personal parent-to-child voice
- **Rich Content**: Includes milestones, photos, memories, and growth tracking

### 2. Intelligent Push Notifications
- **Daily Reminders**: "Time to capture [child's name]'s special moments today!"
- **Weekly Reminders**: "Don't forget to document [child's name]'s amazing week!"
- **Monthly Reminders**: "Capture [child's name]'s monthly milestones!"
- **Personalized**: Uses actual child's name in notifications
- **Preference-Based**: Respects user notification settings

### 3. Social Interaction Notifications
- **Like Notifications**: "Sarah liked your post about Emma's first steps"
- **Comment Notifications**: "John commented on your journal entry"
- **Share Notifications**: "Mike shared your memory with family"
- **Follow Notifications**: "Lisa started following your family's journey"

### 4. Smart Content Management
- **Journal Entry Aggregation**: Collects and organizes all entries
- **Photo Integration**: Links photos to specific memories
- **Milestone Tracking**: Automatically identifies key developmental moments
- **Timeline Creation**: Builds chronological story of child's growth

### 5. User Management
- **Device Token Registration**: Manages mobile device tokens for push notifications
- **Notification Preferences**: Stores user notification settings
- **Family Profiles**: Manages multiple children per family
- **Privacy Controls**: User-controlled sharing and visibility

## 🔄 How It All Works Together

### 1. Content Creation Flow
```
Parent creates journal entry → AI analyzes content → 
Recap generated → Push notification sent → 
Memory preserved in timeline
```

### 2. Notification Flow
```
Scheduled job runs → Checks user preferences → 
Creates personalized message → Sends via FCM → 
User receives on device
```

### 3. AI Processing Flow
```
Collect journal entries → Build AI prompt → 
Generate recap → Parse response → 
Store in Firestore → Send to user
```

## 📊 Data Structure

### Firestore Collections

#### Users
```javascript
users/{userId}
├── displayName: "Sarah Johnson"
├── email: "sarah@email.com"
├── children: ["emma_123", "liam_456"]
├── notificationPreferences: {
│   ├── dailyReminders: true,
│   ├── weeklyReminders: true,
│   └── monthlyReminders: true
└── deviceTokens: {
    └── token123: {
        ├── platform: "ios",
        └── createdAt: timestamp
    }
}
```

#### Journal Entries
```javascript
posts/{postId}
├── userId: "user_123"
├── childId: "emma_123"
├── title: "Emma's First Steps!"
├── content: "Today Emma took her first steps..."
├── photos: ["photo_url_1", "photo_url_2"]
├── milestones: ["first_steps", "walking"]
├── createdAt: timestamp
└── likes: ["user_456", "user_789"]
```

#### Recaps
```javascript
recaps/{recapId}
├── userId: "user_123"
├── childId: "emma_123"
├── type: "weekly" | "monthly" | "yearly"
├── content: "AI-generated recap text"
├── highlights: ["first words", "started walking"]
├── photos: ["photo_url_1"]
├── createdAt: timestamp
└── aiPrompt: "full prompt sent to AI"
```

## 🚀 API Endpoints

### Recap Generation
- `generateWeeklyRecap(userId, childId)` - Generate weekly recap
- `generateMonthlyRecap(userId, childId)` - Generate monthly recap  
- `generateYearlyRecap(userId, childId)` - Generate yearly recap

### Notifications
- `sendPushNotification(userId, title, body, data)` - Send custom notification
- `registerDeviceToken(userId, token, platform)` - Register device for notifications
- `updateNotificationPreferences(userId, preferences)` - Update user preferences

### Social Features
- `sendLikeNotification(likerId, postOwnerId, postId)` - Notify about likes
- `sendCommentNotification(commenterId, postOwnerId, postId, comment)` - Notify about comments
- `sendShareNotification(sharerId, postOwnerId, postId)` - Notify about shares

## 🤖 AI Integration

### OpenAI Prompt Structure
```
Write a warm, personal recap for a parent about their child [Child's Name]:

Recent entries:
- [Entry 1]
- [Entry 2]
- [Entry 3]

Please create a [weekly/monthly/yearly] summary that:
1. Uses warm, parent-to-child voice
2. Highlights key moments and milestones
3. Includes emotional reflection
4. Reads like a loving letter to the child
```

### AI Response Format
```json
{
  "summary": "Warm, personal summary text",
  "keyMoments": ["first steps", "first words"],
  "milestones": ["started walking", "said mama"],
  "emotionalReflection": "How the parent feels about this period"
}
```

## 📱 Push Notification Examples

### Daily Reminder
```json
{
  "title": "Daily Reminder",
  "body": "Time to capture Emma's special moments today!",
  "data": {
    "type": "daily_reminder",
    "childName": "Emma",
    "screen": "add_entry"
  }
}
```

### Weekly Recap Generated
```json
{
  "title": "Emma's Weekly Recap Ready!",
  "body": "Your weekly summary of Emma's amazing week is ready to view",
  "data": {
    "type": "recap_ready",
    "recapType": "weekly",
    "childName": "Emma"
  }
}
```

### Social Interaction
```json
{
  "title": "Sarah liked your post",
  "body": "Sarah liked your journal entry about Emma's first steps",
  "data": {
    "type": "like",
    "userId": "sarah_123",
    "postId": "post_456"
  }
}
```

## 🔄 Scheduled Jobs

### Daily Reminders (9:00 AM)
- Checks all users with daily reminders enabled
- Sends personalized daily reminder
- Uses child's actual name in message

### Weekly Recap Generation (Sunday 8:00 PM)
- Collects week's journal entries
- Generates AI-powered weekly recap
- Sends notification that recap is ready

### Monthly Recap Generation (Last day of month)
- Collects entire month's entries
- Creates comprehensive monthly summary
- Includes photo highlights and major milestones

## 🎯 What This Means for Users

### For Parents:
- **Never miss a moment**: Daily reminders ensure consistent journaling
- **Beautiful memories**: AI creates warm, personal recaps that read like love letters
- **Milestone tracking**: Automatically identifies and highlights key developmental moments
- **Family sharing**: Social features allow sharing memories with family

### For Children (Future):
- **Complete life story**: Comprehensive timeline from birth to present
- **Parent's voice**: All content written in parent's loving voice
- **Rich media**: Photos and videos linked to specific memories
- **Milestone documentation**: Detailed record of growth and development

## 🚀 Getting Started

### 1. Setup Environment
```bash
# Install dependencies
npm install

# Set environment variables
export OPENAI_API_KEY="your_key_here"
export FIREBASE_PROJECT_ID="your_project_id"
```

### 2. Deploy Functions
```bash
firebase deploy --only functions
```

### 3. Test System
```bash
# Test recap generation
node test/recapDemo.js

# Test notifications
node test/notificationDemo.js

# Test complete system
node test/integrationTest.js
```

## ✅ System Status: FULLY OPERATIONAL

All components are tested and ready:
- ✅ AI recap generation working perfectly
- ✅ Push notifications working perfectly  
- ✅ Firebase integration configured
- ✅ Firestore data structure optimized
- ✅ Error handling implemented
- ✅ Testing suite complete

**Your SproutBook backend is ready to preserve precious family memories!**
