# Daily Recap Index Setup Guide

## Required Firestore Indexes for Daily Recaps

The daily recap generation requires specific composite indexes to handle the complex queries efficiently. This guide covers the setup process.

## Index Requirements

Based on the `JournalAggregator.buildOptimizedQuery()` method, the following composite indexes are required:

### Primary Composite Index
**Purpose**: Main query for daily recap aggregation
**Fields**:
- `userId` (ASCENDING)
- `childIds` (ARRAY_CONTAINS)
- `createdAt` (DESCENDING)

### Additional Indexes for Performance
**Purpose**: Handle edge cases and optimize different query patterns

1. **User + Date Range**
   - `userId` (ASCENDING)
   - `createdAt` (DESCENDING)

2. **Child + Date Range**
   - `childIds` (ARRAY_CONTAINS)
   - `createdAt` (DESCENDING)

3. **Full Composite**
   - `userId` (ASCENDING)
   - `childIds` (ARRAY_CONTAINS)
   - `createdAt` (ASCENDING)
   - `__name__` (ASCENDING)

## ⚡ IMMEDIATE ACTION: Firebase Console (Manual)

Since local files aren't auto-deployed, create indexes directly in Firebase Console:

### Steps:
1. Go to: https://console.firebase.google.com
2. Select your project
3. **Firestore Database** → **Indexes** tab
4. Click **"Add Index"** button
5. Create these exact indexes:

#### Index 1 (Essential)
- Collection: `journalEntries`
- Fields: `userId` (Ascending) + `childIds` (Array contains) + `createdAt` (Descending)

#### Index 2 (Backup)
- Collection: `journalEntries` 
- Fields: `userId` (Ascending) + `createdAt` (Descending)

#### Index 3 (Child-focused)
- Collection: `journalEntries`
- Fields: `childIds` (Array contains) + `createdAt` (Descending)

6. Wait 5-10 minutes for each index to build
7. Test with: `./verify-daily-recap-indexes.js`

---

## Setup Instructions (Alternative)

### Method 1: Firebase CLI (Recommended)

1. **Deploy indexes automatically**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

2. **Check index status**:
   ```bash
   firebase firestore:indexes
   ```

### Method 2: Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes**
4. Click **Add Index**
5. Configure each index as specified above

### Method 3: Manual Index Creation

Use the provided `firestore.indexes.json` file:

1. **Deploy the indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

2. **Verify deployment**:
   ```bash
   firebase firestore:indexes
   ```

## Troubleshooting Index Issues

### Common Error Messages

1. **"FAILED_PRECONDITION: The query requires an index"**
   - Solution: Ensure all required indexes are created
   - Check: `firebase firestore:indexes` to verify

2. **"Index not serving"**
   - Solution: Wait for index to build (can take 10+ minutes)
   - Check: Index status in Firebase Console

3. **"Query scope mismatch"**
   - Solution: Ensure indexes are created for COLLECTION scope

### Verification Commands

1. **Check existing indexes**:
   ```bash
   firebase firestore:indexes
   ```

2. **Test daily recap generation**:
   ```bash
   curl -X POST "https://us-central1-YOUR_PROJECT.cloudfunctions.net/generateDailyRecap" \
        -H "Authorization: Bearer YOUR_ID_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"userId": "testUser", "childId": "testChild"}'
   ```

3. **Monitor Firestore logs**:
   ```bash
   firebase functions:log --only generateDailyRecap
   ```

## Index Optimization Tips

1. **Order matters**: Always put equality filters first (`==`), then array contains, then range filters (`>=`, `<=`)
2. **Single-field indexes**: Ensure single-field indexes exist for all fields used in queries
3. **Composite indexes**: Create composite indexes for multi-field queries
4. **Monitor usage**: Use Firebase Performance Monitoring to track query performance

## Data Model Validation

Ensure your Firestore collections match the expected structure:

### journalEntries Collection
- **userId**: string (required)
- **childIds**: array of strings (required)
- **createdAt**: timestamp (required)
- **content**: string
- **isMilestone**: boolean
- **isFavorited**: boolean
- **media**: array

### children Collection
- **userId**: string (required)
- **name**: string
- **birthDate**: timestamp

## Testing the Setup

After index deployment:

1. **Create test data**:
   ```javascript
   // Add test journal entries
   db.collection('journalEntries').add({
     userId: 'testUser',
     childIds: ['testChild'],
     createdAt: new Date(),
     content: 'Test daily entry',
     isMilestone: false,
     isFavorited: true
   });
   ```

2. **Trigger daily recap**:
   ```bash
   node test-local-function.js generateDailyRecap testUser testChild
   ```

3. **Verify logs**:
   - Look for "Starting daily recap generation..."
   - Confirm "Journal aggregation completed successfully"
   - Check for "Saving daily recap..."

## Index Status Monitoring

Create a monitoring script to check index health:

```javascript
// check-indexes.js
const { execSync } = require('child_process');

function checkIndexes() {
  try {
    const output = execSync('firebase firestore:indexes', { encoding: 'utf8' });
    console.log('Current indexes:', output);
  } catch (error) {
    console.error('Error checking indexes:', error);
  }
}

checkIndexes();
```

## Support

If you continue to see index-related errors:

1. Double-check field names match exactly between code and Firestore
2. Verify collection names are correct
3. Ensure timestamps are properly formatted
4. Check Firestore rules for read permissions
5. Use Firebase Support for complex indexing issues
