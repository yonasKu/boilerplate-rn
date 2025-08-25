# SproutBook Recap Testing Guide

## Overview
This guide focuses specifically on testing the recap generation functionality, including weekly, monthly, and yearly recaps with AI content generation.

## Prerequisites
1. Environment variables must be configured (see ENVIRONMENT_GUIDE.md)
2. Firebase emulators or production environment must be running
3. OpenAI API key must be valid

## Quick Test Commands

### 1. Test All Recap Services
```bash
# Run the comprehensive recap test
node test/recapTest.js

# Test specific recap types
node test/recapTest.js weekly
node test/recapTest.js monthly  
node test/recapTest.js yearly
```

### 2. Manual Function Testing
```bash
# Test weekly recap generation
node -e "require('./services/recapGenerator').testWeeklyRecap()"

# Test monthly recap generation  
node -e "require('./services/recapGenerator').testMonthlyRecap()"

# Test yearly recap generation
node -e "require('./services/recapGenerator').testYearlyRecap()"
```

## Test Data Setup

### Create Test Journal Entries
```javascript
// Add test entries to Firestore
const testEntries = [
  {
    userId: 'test_user_123',
    childId: 'test_child_456',
    content: 'Today Emma took her first steps! She was so excited and proud of herself. We captured it on video - her little face lighting up with joy was priceless.',
    date: new Date(),
    isMilestone: true,
    isFavorited: true,
    media: ['video_001.mp4'],
    childAgeAtEntry: '12 months'
  },
  {
    userId: 'test_user_123',
    childId: 'test_child_456', 
    content: 'Emma said her first word today - "mama"! I was cooking dinner and she just looked at me and said it so clearly. My heart melted.',
    date: new Date(Date.now() - 86400000),
    isMilestone: true,
    isFavorited: true,
    childAgeAtEntry: '11 months'
  }
];
```

## Testing Scenarios

### 1. Happy Path Testing
- **Scenario**: Generate recap with sufficient entries
- **Expected**: Successful AI-generated recap
- **Test Command**: `node test/recapTest.js weekly`

### 2. Edge Case Testing
- **Scenario**: Generate recap with insufficient entries
- **Expected**: Graceful handling with appropriate message
- **Test Command**: `node test/recapTest.js weekly --min-entries=10`

### 3. AI Content Quality Testing
- **Scenario**: Verify AI generates contextually relevant content
- **Expected**: Content references actual journal entries
- **Test Command**: `node test/recapTest.js --validate-content`

## Testing Checklist

### Weekly Recap Tests
- [ ] Test with 3+ entries (minimum required)
- [ ] Test milestone detection
- [ ] Test media content analysis
- [ ] Test AI prompt generation
- [ ] Test Firestore save
- [ ] Test response structure

### Monthly Recap Tests  
- [ ] Test with 5+ entries (minimum required)
- [ ] Test date range calculation
- [ ] Test comprehensive summary
- [ ] Test key moments extraction
- [ ] Test emotional tone analysis

### Yearly Recap Tests
- [ ] Test with 10+ entries (minimum required)
- [ ] Test annual milestone summary
- [ ] Test growth journey narrative
- [ ] Test long-term insights

## Validation Commands

### Check AI Service Connection
```bash
curl -X POST "http://localhost:5001/your-project/us-central1/testOpenAIConnection" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Validate Recap Generation
```bash
curl -X POST "http://localhost:5001/your-project/us-central1/generateWeeklyRecap" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "childId": "test_child_456",
    "startDate": "2024-01-01",
    "endDate": "2024-01-07"
  }'
```

## Debugging Commands

### Check Environment Variables
```bash
node -e "console.log(require('./utils/environmentValidator').getConfigSummary())"
```

### Test OpenAI Prompt Generation
```bash
node -e "
const OpenAIService = require('./services/openAIService');
const service = new OpenAIService();
const mockData = {totalEntries: 3, entries: [{content: 'Test entry'}]};
console.log(service.buildPrompt(mockData, 'weekly'));
"
```

### Check Firestore Data Structure
```bash
node -e "
const { db } = require('./firebaseAdmin');
db.collection('journal_entries').limit(5).get().then(snapshot => {
  snapshot.forEach(doc => console.log(doc.id, doc.data()));
});
"
```

## Performance Testing

### Load Testing
```bash
# Test recap generation with large datasets
node test/recapTest.js --load-test --entries=100

# Test processing time measurement
node test/recapTest.js --performance-test
```

### Memory Usage Testing
```bash
# Monitor memory usage during recap generation
node --max-old-space-size=512 test/recapTest.js --memory-test
```

## Error Handling Tests

### Test Insufficient Entries
```bash
# Test with too few entries
node test/recapTest.js --insufficient-entries
```

### Test Invalid Date Ranges
```bash
# Test with invalid date parameters
node test/recapTest.js --invalid-dates
```

### Test AI Service Failures
```bash
# Test OpenAI service failure handling
node test/recapTest.js --ai-failure
```

## Test Results Format

### Successful Test Output
```json
{
  "testType": "weekly_recap",
  "success": true,
  "recapId": "abc123",
  "title": "Emma's Amazing Week",
  "summary": "This week was filled with incredible milestones...",
  "processingTime": 2500,
  "totalEntries": 5,
  "milestones": 2,
  "mediaCount": 3
}
```

### Failed Test Output
```json
{
  "testType": "weekly_recap",
  "success": false,
  "error": "Insufficient entries for recap generation",
  "totalEntries": 1,
  "minimumRequired": 3
}
```

## Continuous Testing

### GitHub Actions Integration
```yaml
name: Recap Tests
on: [push, pull_request]
jobs:
  test-recaps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Test Weekly Recaps
        run: node test/recapTest.js weekly
      - name: Test Monthly Recaps  
        run: node test/recapTest.js monthly
      - name: Test Yearly Recaps
        run: node test/recapTest.js yearly
```

## Support & Troubleshooting

### Common Issues
1. **"Insufficient entries"** - Add more test entries
2. **"OpenAI API key invalid"** - Verify API key format
3. **"Firestore connection failed"** - Check emulator/prod settings
4. **"Date range invalid"** - Verify date parameters

### Debug Commands
```bash
# Check service health
firebase functions:shell
> generateWeeklyRecap({userId: "test", childId: "test", startDate: "2024-01-01", endDate: "2024-01-07"})
```
