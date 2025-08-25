# Firebase Login & Setup Guide

## 🔐 Firebase Authentication Required

Since we're in a development environment, we need to properly authenticate with Firebase. Here's the step-by-step process:

## Method 1: Interactive Login (Recommended)

### Step 1: Open Terminal
Open a new terminal window (not through the script):

```bash
cd /Users/administrator/Desktop/project/Sproutbook-Backend
```

### Step 2: Interactive Firebase Login
```bash
# Use full path to avoid node issues
/usr/local/Cellar/node/24.2.0/bin/node /usr/local/lib/node_modules/firebase-tools/lib/bin/firebase.js login
```

This will open a browser window for you to authenticate with your Google account.

### Step 3: Verify Login
```bash
# Check if you're logged in
/usr/local/Cellar/node/24.2.0/bin/node /usr/local/lib/node_modules/firebase-tools/lib/bin/firebase.js projects:list
```

## Method 2: Service Account (For CI/CD)

### Step 1: Generate Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `sproutbook-d0c8f`
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Save the JSON file as `service-account.json` in your project root

### Step 2: Set Environment Variable
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/Users/administrator/Desktop/project/Sproutbook-Backend/service-account.json"
```

## Method 3: Application Default Credentials (ADC)

### Step 1: Install Google Cloud SDK
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
gcloud auth application-default login
```

### Step 2: Verify ADC
```bash
gcloud auth application-default print-access-token
```

## 🔧 Quick Setup Commands

Run these commands in order:

```bash
# 1. Navigate to project
cd /Users/administrator/Desktop/project/Sproutbook-Backend

# 2. Login to Firebase
/usr/local/Cellar/node/24.2.0/bin/node /usr/local/lib/node_modules/firebase-tools/lib/bin/firebase.js login

# 3. Select project
/usr/local/Cellar/node/24.2.0/bin/node /usr/local/lib/node_modules/firebase-tools/lib/bin/firebase.js use sproutbook-d0c8f

# 4. Verify setup
/usr/local/Cellar/node/24.2.0/bin/node /usr/local/lib/node_modules/firebase-tools/lib/bin/firebase.js projects:list

# 5. Test functions
/usr/local/Cellar/node/24.2.0/bin/node /usr/local/lib/node_modules/firebase-tools/lib/bin/firebase.js emulators:start --only functions
```

## 🚨 Common Login Issues & Solutions

### Issue 1: "Cannot run login in non-interactive mode"
**Solution**: Run login directly in terminal, not through scripts

### Issue 2: "Node not found"
**Solution**: Use full path to node:
```bash
/usr/local/Cellar/node/24.2.0/bin/node /usr/local/lib/node_modules/firebase-tools/lib/bin/firebase.js login
```

### Issue 3: "Project not found"
**Solution**: Ensure project exists:
```bash
firebase projects:list
```

### Issue 4: Permission denied
**Solution**: Ensure you have owner/editor access to the Firebase project

## ✅ Verification Steps

After login, verify everything works:

```bash
# Check current project
firebase projects:list

# Check functions
firebase functions:list

# Start emulators
firebase emulators:start --only functions,firestore,auth

# In another terminal, test endpoints
curl http://localhost:5001/sproutbook-d0c8f/us-central1/registerDeviceToken \
  -H "Content-Type: application/json" \
  -d '{"token": "test-token", "platform": "ios"}'
```

## 🎯 One-Line Setup Script

Save this as `setup-firebase.sh`:

```bash
#!/bin/bash

echo "🔐 Firebase Setup & Login"
echo "========================"

# Kill any existing processes
pkill -f firebase 2>/dev/null || true

# Navigate to project
cd /Users/administrator/Desktop/project/Sproutbook-Backend

# Check if already logged in
if /usr/local/Cellar/node/24.2.0/bin/node /usr/local/lib/node_modules/firebase-tools/lib/bin/firebase.js projects:list > /dev/null 2>&1; then
    echo "✅ Already logged in to Firebase"
else
    echo "🔐 Please login to Firebase..."
    /usr/local/Cellar/node/24.2.0/bin/node /usr/local/lib/node_modules/firebase-tools/lib/bin/firebase.js login
fi

# Set project
echo "📋 Setting project..."
/usr/local/Cellar/node/24.2.0/bin/node /usr/local/lib/node_modules/firebase-tools/lib/bin/firebase.js use sproutbook-d0c8f

# Verify setup
echo "✅ Verifying setup..."
/usr/local/Cellar/node/24.2.0/bin/node /usr/local/lib/node_modules/firebase-tools/lib/bin/firebase.js projects:list

echo "🎉 Firebase setup complete!"
echo "Next: firebase emulators:start --only functions,firestore,auth"
```

Make it executable:
```bash
chmod +x setup-firebase.sh
./setup-firebase.sh
```
