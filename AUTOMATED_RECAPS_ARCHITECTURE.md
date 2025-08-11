# Automated Recaps Architecture - No User Selection

## 🔄 **Automatic Generation Architecture**

**Weekly and Monthly recaps are generated automatically by scheduled Firebase Cloud Functions** - users never select or trigger anything.

## 📅 **Automated Schedule**

### **Weekly Recaps**
- **Trigger**: Every Monday at 9:00 AM
- **Process**: Automatically generates recap for previous week
- **User Action**: None - appears automatically in app

### **Monthly Recaps**  
- **Trigger**: 1st of every month at 9:00 AM
- **Process**: Automatically generates recap for previous month
- **User Action**: None - appears automatically in app

## 🏗️ **Firebase Scheduled Functions**

### **Weekly Auto-Generation**
```javascript
// functions/recaps/weeklyAutoGenerator.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Runs every Monday at 9:00 AM
exports.scheduledWeeklyRecaps = functions.pubsub
  .schedule('0 9 * * 1')  // Every Monday 9:00 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    
    console.log('Starting weekly recap generation...');
    
    // 1. Find all active users
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('subscriptionStatus', '==', 'active')
      .get();
    
    // 2. Process each user
    const promises = [];
    usersSnapshot.forEach(async (userDoc) => {
      const userId = userDoc.id;
      
      // 3. Get user's children
      const childrenSnapshot = await admin.firestore()
        .collection('children')
        .where('userId', '==', userId)
        .get();
      
      childrenSnapshot.forEach(async (childDoc) => {
        const childId = childDoc.id;
        
        // 4. Check if enough journal entries exist
        const lastWeek = getPreviousWeekRange();
        
        const entriesSnapshot = await admin.firestore()
          .collection('journalEntries')
          .where('userId', '==', userId)
          .where('childId', '==', childId)
          .where('date', '>=', lastWeek.start)
          .where('date', '<=', lastWeek.end)
          .get();
        
        if (entriesSnapshot.size >= 3) {  // Minimum 3 entries for recap
          promises.push(generateWeeklyRecap(userId, childId, lastWeek));
        }
      });
    });
    
    await Promise.all(promises);
    console.log('Weekly recap generation completed');
  });

async function generateWeeklyRecap(userId, childId, weekRange) {
  // Fetch journal entries
  const entries = await fetchJournalEntries(userId, childId, weekRange);
  
  // Generate AI recap
  const aiResponse = await callOpenAIAPI(entries, 'weekly');
  
  // Save to Firestore
  await saveRecapToFirestore(userId, childId, 'weekly', weekRange, aiResponse);
  
  // Send push notification (optional)
  await sendRecapNotification(userId, childId, 'weekly');
}
```

### **Monthly Auto-Generation**
```javascript
// functions/recaps/monthlyAutoGenerator.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Runs 1st of every month at 9:00 AM
exports.scheduledMonthlyRecaps = functions.pubsub
  .schedule('0 9 1 * *')  // 1st of every month 9:00 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    
    console.log('Starting monthly recap generation...');
    
    const lastMonth = getPreviousMonthRange();
    
    // Same process as weekly, but for month range
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('subscriptionStatus', '==', 'active')
      .get();
    
    const promises = [];
    usersSnapshot.forEach(async (userDoc) => {
      const userId = userDoc.id;
      
      const childrenSnapshot = await admin.firestore()
        .collection('children')
        .where('userId', '==', userId)
        .get();
      
      childrenSnapshot.forEach(async (childDoc) => {
        const childId = childDoc.id;
        
        const entriesSnapshot = await admin.firestore()
          .collection('journalEntries')
          .where('userId', '==', userId)
          .where('childId', '==', childId)
          .where('date', '>=', lastMonth.start)
          .where('date', '<=', lastMonth.end)
          .get();
        
        if (entriesSnapshot.size >= 5) {  // Minimum 5 entries for monthly
          promises.push(generateMonthlyRecap(userId, childId, lastMonth));
        }
      });
    });
    
    await Promise.all(promises);
    console.log('Monthly recap generation completed');
  });
```

## 🔄 **Complete Automated Flow**

### **1. Time-Based Trigger**
```
Monday 9:00 AM → Firebase Scheduled Function → Process All Users
```

### **2. Processing Steps**
```
1. Find active users
2. Get their children
3. Check journal entries for period
4. Generate AI recap if enough entries
5. Save to Firestore
6. Send push notification
7. Update UI automatically
```

### **3. User Experience**
```
User opens app Monday → New weekly recap appears automatically
User opens app 1st of month → New monthly recap appears automatically
```

## 📱 **React Native UI (Auto-Update)**

### **Real-Time Updates**
```typescript
// src/hooks/useAutoRecaps.ts
import { useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';

export const useAutoRecaps = (userId, childId) => {
  const [recaps, setRecaps] = useState([]);
  
  useEffect(() => {
    // Listen for new recaps created by scheduled functions
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'recaps'),
        where('userId', '==', userId),
        where('childId', '==', childId),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const newRecaps = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecaps(newRecaps);
      }
    );
    
    return unsubscribe;
  }, [userId, childId]);
  
  return recaps;
};
```

### **UI Component**
```typescript
// src/features/recaps/screens/RecapsScreen.tsx
const RecapsScreen = () => {
  const { user } = useAuth();
  const { selectedChild } = useChildContext();
  const recaps = useAutoRecaps(user?.uid, selectedChild?.id);
  
  // Recaps appear automatically - no user action needed
  return (
    <FlatList
      data={recaps}
      renderItem={({ item }) => <RecapCard recap={item} />}
      keyExtractor={(item) => item.id}
    />
  );
};
```

## ⚙️ **Configuration Setup**

### **Firebase Functions Configuration**
```javascript
// functions/index.js
const functions = require('firebase-functions');

// Import all automated functions
const weeklyRecaps = require('./recaps/weeklyAutoGenerator');
const monthlyRecaps = require('./recaps/monthlyAutoGenerator');

// Export scheduled functions
exports.scheduledWeeklyRecaps = weeklyRecaps.scheduledWeeklyRecaps;
exports.scheduledMonthlyRecaps = monthlyRecaps.scheduledMonthlyRecaps;
```

### **Environment Variables**
```bash
# Set in Firebase console or CLI
firebase functions:config:set openai.key="your-openai-key"
firebase functions:config:set gemini.key="your-gemini-key"
```

## 📊 **Deployment Commands**

### **Deploy Scheduled Functions**
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific scheduled functions
firebase deploy --only functions:scheduledWeeklyRecaps,scheduledMonthlyRecaps

# Test locally
firebase emulators:start --only functions
```

## 🔔 **Push Notifications (Optional)**

### **Notification for New Recaps**
```javascript
// functions/notifications/recapNotifications.js
async function sendRecapNotification(userId, childId, type) {
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(userId)
    .get();
    
  const childDoc = await admin.firestore()
    .collection('children')
    .doc(childId)
    .get();
    
  const message = {
    notification: {
      title: `${childDoc.data().name}'s ${type} recap is ready!`,
      body: `Tap to view the beautiful memories from the past ${type}.`
    },
    token: userDoc.data().pushToken
  };
  
  await admin.messaging().send(message);
}
```

## ✅ **Complete Automated System**

### **No User Interaction Required**
- **Weekly**: Every Monday 9:00 AM
- **Monthly**: 1st of every month 9:00 AM
- **Process**: Automatic for all active users
- **Result**: Recaps appear in app automatically

### **Monitoring**
- **Firebase Console**: View function execution logs
- **Firestore**: Check generated recaps collection
- **Usage**: Monitor AI API costs in Firebase billing

This creates a **fully automated system** where users simply open their app and see their weekly/monthly recaps - no buttons to press, no selections to make!
