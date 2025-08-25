# SproutBook Push Notification Testing Guide

## Overview
This guide provides comprehensive testing for push notifications, including device token management, scheduled reminders, and Firebase Cloud Messaging (FCM) integration.

## Prerequisites
1. Firebase project configured with FCM
2. Device tokens registered in Firestore
3. Environment variables properly set

## Quick Test Commands

### 1. Test Notification Service
```bash
# Test notification service directly
node test/notificationTest.js

# Test specific notification types
node test/notificationTest.js daily
node test/notificationTest.js weekly
node test/notificationTest.js monthly
```

### 2. Test Device Token Management
```bash
# Test device token registration
node test/notificationTest.js tokens

# Test notification sending
node test/notificationTest.js send
```

### 3. Test Scheduled Reminders
```bash
# Test daily reminders
node test/notificationTest.js daily-reminders

# Test weekly reminders
node test/notificationTest.js weekly-reminders

# Test monthly reminders
node test/notificationTest.js monthly-reminders
```

## Environment Setup Check

### Required Environment Variables
```bash
# Check if all required variables are set
node -e "console.log('FCM Required:', !!process.env.FIREBASE_PROJECT_ID)"
node -e "console.log('Firebase Admin:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS)"
```

### Firebase Configuration Test
```bash
# Test Firebase Admin SDK
node -e "
const admin = require('firebase-admin');
admin.initializeApp();
console.log('✅ Firebase Admin initialized');
"
```

## Test Data Setup

### Create Test Users with Notifications
```javascript
// Add test user with notification preferences
const testUser = {
  userId: 'test_user_notifications_123',
  email: 'test@example.com',
  notificationPreferences: {
    dailyReminders: true,
    weeklyReminders: true,
    monthlyReminders: true,
    pushNotifications: true
  },
  deviceTokens: [
    {
      token: 'test_device_token_123456789',
      platform: 'ios',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};
```

### Create Test Journal Entries
```javascript
// Add test journal entries for reminder context
const testEntries = [
  {
    userId: 'test_user_notifications_123',
    childId: 'test_child_456',
    content: 'Test reminder context entry',
    date: new Date(Date.now() - 86400000),
    isMilestone: false,
    createdAt: new Date()
  }
];
```

## Testing Scenarios

### 1. Device Token Registration
- **Scenario**: Register a new device token
- **Expected**: Token saved to Firestore with proper metadata
- **Test Command**: `node test/notificationTest.js register-token`

### 2. Push Notification Sending
- **Scenario**: Send test push notification
- **Expected**: Notification delivered to device
- **Test Command**: `node test/notificationTest.js send-notification`

### 3. Scheduled Reminder Jobs
- **Scenario**: Test daily reminder job
- **Expected**: Notifications sent to users with daily reminders enabled
- **Test Command**: `node test/notificationTest.js daily-reminders`

### 4. Notification Preferences
- **Scenario**: Test preference filtering
- **Expected**: Only users with enabled preferences receive notifications
- **Test Command**: `node test/notificationTest.js preferences`

## Testing Checklist

### Device Token Management
- [ ] Register device token successfully
- [ ] Update device token metadata
- [ ] Remove expired device tokens
- [ ] Handle duplicate token registrations

### Push Notification Delivery
- [ ] Send notification to single device
- [ ] Send notification to multiple devices
- [ ] Handle failed delivery attempts
- [ ] Retry failed notifications

### Scheduled Reminders
- [ ] Daily reminder job execution
- [ ] Weekly reminder job execution
- [ ] Monthly reminder job execution
- [ ] Proper user filtering based on preferences

### Error Handling
- [ ] Invalid device token handling
- [ ] Network connectivity issues
- [ ] Firebase Cloud Messaging errors
- [ ] Rate limiting and quota management

## Validation Commands

### Check Device Tokens
```bash
# List all device tokens for a user
curl -X GET "http://localhost:5001/your-project/us-central1/getDeviceTokens" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_notifications_123"}'
```

### Send Test Notification
```bash
# Send test push notification
curl -X POST "http://localhost:5001/your-project/us-central1/sendTestNotification" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_notifications_123",
    "title": "Test Notification",
    "body": "This is a test push notification",
    "data": {"type": "test", "timestamp": "2024-01-15T10:00:00Z"}
  }'
```

### Test Scheduled Functions
```bash
# Test daily reminders
curl -X POST "http://localhost:5001/your-project/us-central1/testDailyReminders" \
  -H "Content-Type: application/json" \
  -d '{}'

# Test weekly reminders
curl -X POST "http://localhost:5001/your-project/us-central1/testWeeklyReminders" \
  -H "Content-Type: application/json" \
  -d '{}'

# Test monthly reminders
curl -X POST "http://localhost:5001/your-project/us-central1/testMonthlyReminders" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Debugging Commands

### Check Firebase Cloud Messaging
```bash
# Check FCM configuration
node -e "
const admin = require('firebase-admin');
admin.initializeApp();
const messaging = admin.messaging();
console.log('FCM initialized successfully');
"
```

### Test Device Token Validation
```bash
# Validate device token format
node -e "
const token = 'test_device_token_123456789';
const isValid = /^[a-zA-Z0-9:_-]+$/.test(token);
console.log('Token valid:', isValid);
"
```

### Check Notification Service
```bash
# Test notification service initialization
node -e "
const NotificationService = require('./services/notificationService');
const service = new NotificationService();
console.log('Notification service initialized');
"
```

## Performance Testing

### Load Testing
```bash
# Test notification sending with multiple devices
node test/notificationTest.js --load-test --devices=100

# Test scheduled job performance
node test/notificationTest.js --performance-test
```

### Memory Usage Testing
```bash
# Monitor memory usage during notification processing
node --max-old-space-size=512 test/notificationTest.js --memory-test
```

## Error Handling Tests

### Test Invalid Device Tokens
```bash
# Test with invalid token
node test/notificationTest.js --invalid-token

# Test with expired token
node test/notificationTest.js --expired-token
```

### Test Network Failures
```bash
# Test FCM service unavailable
node test/notificationTest.js --service-unavailable

# Test rate limiting
node test/notificationTest.js --rate-limit
```

## Test Results Format

### Successful Test Output
```json
{
  "testType": "push_notification",
  "success": true,
  "notificationId": "notif_123",
  "deviceTokens": 2,
  "successfulDeliveries": 2,
  "failedDeliveries": 0,
  "processingTime": 250
}
```

### Failed Test Output
```json
{
  "testType": "push_notification",
  "success": false,
  "error": "Invalid device token format",
  "failedTokens": ["invalid_token"],
  "errorCode": "INVALID_REGISTRATION"
}
```

## Continuous Testing

### GitHub Actions Integration
```yaml
name: Push Notification Tests
on: [push, pull_request]
jobs:
  test-notifications:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Test Device Token Management
        run: node test/notificationTest.js tokens
      - name: Test Push Notification Sending
        run: node test/notificationTest.js send
      - name: Test Scheduled Reminders
        run: node test/notificationTest.js daily-reminders
```

## Support & Troubleshooting

### Common Issues
1. **"Invalid device token"** - Check token format and validity
2. **"FCM service unavailable"** - Check Firebase project configuration
3. **"Authentication failed"** - Verify Firebase Admin SDK setup
4. **"Rate limit exceeded"** - Implement retry logic with backoff

### Debug Commands
```bash
# Check Firebase project configuration
firebase projects:list

# Check FCM credentials
firebase functions:config:get

# Test notification in Firebase shell
firebase functions:shell
> sendNotification({userId: "test", title: "Test", body: "Test notification"})
```
