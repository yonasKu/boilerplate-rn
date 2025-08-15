# SproutBook Environment Variables Guide

## Overview
This guide shows you how to set up the essential environment variables for SproutBook Firebase Functions using modern Firebase authentication that doesn't require downloading JSON files.

## 🔧 Firebase Configuration (Required - Modern Method)

### Method 1: Application Default Credentials (Recommended & Most Secure)
Your organization has a policy that blocks creating service account keys, which is a great security practice! This method is the modern, secure way to authenticate and works perfectly with that policy.

**How it works:**
Instead of a key file, your local environment uses your own Google Cloud account credentials to securely connect to Firebase services. No keys, no downloads!

**How to Set Up:**
1. **Install Google Cloud SDK**: If you don't have it, [install it from here](https://cloud.google.com/sdk/docs/install).

2. **Log in and Authenticate**: Run this command in your terminal:
   ```bash
   gcloud auth application-default login
   ```
   This will open a browser window for you to log in with your Google account. Once you do, your local environment is authenticated.

3. **Set Your Project ID**: In your `.env` file, you only need to set the project ID:
   ```bash
   FIREBASE_PROJECT_ID=your-project-id
   # That's it! The Admin SDK will automatically find your credentials.
   ```

### Method 2: Service Account Key (If Method 1 doesn't work)
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

**How to get these without downloading JSON:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key" (if needed)
5. **Alternative**: Use IAM & Admin → Service Accounts → Create Key → Copy key content directly

### OpenAI Configuration
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
```

### AI Content Settings
```bash
MAX_TOKENS=2000
TEMPERATURE=0.7
```

## ⚙️ Basic Settings (Optional with defaults)

### Rate Limiting & Performance
```bash
MAX_REQUESTS_PER_MINUTE=60
MAX_REQUESTS_PER_HOUR=1000
BURST_LIMIT=10
```

### Entry Requirements
```bash
MIN_WEEKLY_ENTRIES=3
MIN_MONTHLY_ENTRIES=5
MIN_YEARLY_ENTRIES=10
```

### Query Limits
```bash
MAX_ENTRIES_PER_QUERY=1000
MAX_CHILDREN_PER_USER=20
```

## 🕐 Scheduling & Timezones

### Recap Schedules (Cron format)
```bash
WEEKLY_RECAP_SCHEDULE=0 9 * * 1    # Every Monday at 9 AM
MONTHLY_RECAP_SCHEDULE=0 9 1 * *   # 1st of each month at 9 AM
YEARLY_RECAP_SCHEDULE=0 9 1 1 *    # January 1st at 9 AM
```

### Timezone Settings
```bash
DEFAULT_TIMEZONE=America/New_York
```

## 🔐 Security & Authentication

### API Security
```bash
API_KEY_ROTATION_INTERVAL=30d
SESSION_TIMEOUT=24h
JWT_SECRET=your-super-secret-jwt-key
```

### CORS Configuration
```bash
CORS_ORIGIN=http://localhost:3000
CORS_ORIGIN_PRODUCTION=https://yourapp.com
```

## 🐛 Development & Debugging

### Debug Settings
```bash
ENABLE_DEBUG_MODE=false
ENABLE_MOCK_DATA=false
SKIP_AI_GENERATION=false
SKIP_FIRESTORE_QUERIES=false
```

### Logging Configuration
```bash
LOG_LEVEL=info
LOG_FORMAT=json
ENABLE_PERFORMANCE_LOGGING=true
```

## 📝 How to Set Up Environment Variables

### Method 1: Using `.env` File (Local Development)
1. Copy `.env.example` to `.env`
2. Fill in your actual values
3. Never commit `.env` to git

```bash
# Create .env file
cp .env.example .env

# Edit with your values
nano .env
```

### Method 2: Using Firebase Environment (Production)
```bash
# Set environment variables in Firebase
firebase functions:config:set sendgrid.key="SG.your-key" openai.key="sk-your-key"

# View current config
firebase functions:config:get
```

### Method 3: Using GitHub Secrets (CI/CD)
1. Go to GitHub repository → Settings → Secrets
2. Add each variable as a secret
3. Use in GitHub Actions workflow

## 🔍 Verification Commands

### Test Firebase Connection
```bash
node -e "require('./firebaseAdmin'); console.log('Firebase connected');"
```

### Test Environment Variables
```bash
node -e "require('./utils/environmentValidator').validateAll();"
```

### Test All Services
```bash
node test/integrationTest.js
```

## 🚨 Security Best Practices

### Never commit these to git:
- `.env` files
- Service account JSON files
- API keys or secrets
- Private keys or certificates

### Use environment-specific files:
```bash
.env.development    # Local development
.env.production    # Production deployment
.env.staging       # Staging environment
```

### Rotate keys regularly:
- Set calendar reminders every 90 days
- Update keys in all environments simultaneously
- Test functionality after rotation

## 📊 Monitoring Setup

### Health Check Endpoints
```bash
# Check service health
curl https://your-app.cloudfunctions.net/health

# Check environment variables
curl https://your-app.cloudfunctions.net/env-status
```

### Error Alerting
- Set up alerts for failed environment variable validation
- Monitor API rate limit warnings
- Track authentication failures

## 🆘 Troubleshooting

### Common Issues:
1. **"Missing environment variable"** - Check `.env` file exists and is loaded
2. **"Invalid API key"** - Verify key format and permissions
3. **"Rate limit exceeded"** - Adjust rate limit settings or upgrade plan
4. **"Permission denied"** - Check Firebase service account permissions

### Debug Commands:
```bash
# Check if environment variables are loaded
node -e "console.log(process.env)"

# Test individual service
node -e "require('./services/journalAggregator').testConnection()"

# Validate configuration
node -e "require('./utils/environmentValidator').validateAll()"
```

## 📞 Support Contacts

- **Firebase Support**: https://firebase.google.com/support
- **OpenAI Support**: https://help.openai.com
- **SendGrid Support**: https://support.sendgrid.com
- **Slack Support**: https://slack.com/help

This guide provides everything needed to properly configure and secure your SproutBook Firebase Functions environment.
