# Firebase Configuration Migration Guide

## Overview

This guide outlines the steps to migrate away from the deprecated `functions.config()` API before March 2026. Your project is already using the recommended approach with environment variables via `dotenv`, but this guide will ensure full compliance and provide best practices.

## Current State Analysis

Your project is already in good shape:

1. ✅ Using `dotenv` for environment variables
2. ✅ Not using `functions.config()` in any code files
3. ✅ Using Application Default Credentials for Firebase Admin
4. ✅ Properly structured `.env` file with configuration values

## Migration Steps

### 1. Verify Environment Variables

All your configuration is already in `.env` file. No changes needed here.

### 2. Check for Legacy Configuration

Run this command to check if any legacy configuration exists:

```bash
firebase functions:config:get
```

If this returns any configuration values, you'll need to migrate them to environment variables.

### 3. Migrate Legacy Configuration (if needed)

If the previous command returned any values, follow these steps:

1. Export current configuration:
   ```bash
   firebase functions:config:get > legacy-config.json
   ```

2. Convert the JSON to environment variables in your `.env` file:
   ```json
   {
     "service": {
       "api_key": "your-api-key"
     }
   }
   ```
   
   Becomes:
   ```env
   SERVICE_API_KEY=your-api-key
   ```

3. Update your code to use `process.env` instead of `functions.config()`:
   ```javascript
   // Old way (deprecated)
   const apiKey = functions.config().service.api_key;
   
   // New way
   const apiKey = process.env.SERVICE_API_KEY;
   ```

### 4. Update Documentation

Your project already has good documentation. No changes needed.

## Best Practices

1. **Never commit sensitive values** to your `.env` file. Use `.env.example` for structure:
   ```bash
   # Create .env.example with placeholder values
   OPENAI_API_KEY=your_openai_api_key_here
   FIREBASE_PROJECT_ID=your_project_id
   ```

2. **Use different environment files** for different environments:
   - `.env.development`
   - `.env.staging`
   - `.env.production`

3. **Validate environment variables** at startup:
   ```javascript
   // In your index.js or a separate validation file
   const requiredEnvVars = [
     'OPENAI_API_KEY',
     'FIREBASE_PROJECT_ID'
   ];
   
   requiredEnvVars.forEach(envVar => {
     if (!process.env[envVar]) {
       throw new Error(`Missing required environment variable: ${envVar}`);
     }
   });
   ```

4. **Use configuration objects** for related settings:
   ```javascript
   const openAIConfig = {
     apiKey: process.env.OPENAI_API_KEY,
     model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
     maxTokens: parseInt(process.env.MAX_TOKENS) || 2000,
     temperature: parseFloat(process.env.TEMPERATURE) || 0.7
   };
   ```

## Validation Script

Create a script to validate your environment configuration:

```javascript
// utils/environmentValidator.js
const fs = require('fs');
const path = require('path');

function validateEnvironment() {
  // Check if .env file exists
  const envPath = path.resolve('.env');
  if (!fs.existsSync(envPath)) {
    console.warn('Warning: .env file not found. Using default environment variables.');
    return;
  }

  // Required environment variables
  const required = [
    'OPENAI_API_KEY',
    'FIREBASE_PROJECT_ID'
  ];

  // Validate required variables
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('Environment validation passed.');
}

module.exports = { validateEnvironment };
```

Then use it in your `index.js`:

```javascript
// At the top of index.js
const { validateEnvironment } = require('./utils/environmentValidator');
validateEnvironment();
```

## Deployment Considerations

1. **Firebase Emulators**: Your local environment is already properly configured.

2. **Firebase Hosting/Functions**: When deploying, ensure your environment variables are set in the Firebase Console:
   - Go to Firebase Console → Your Project → Functions → Environment Variables
   - Or use the CLI: `firebase functions:config:set service.api_key="your-key"`
   - But prefer the new approach: Set environment variables in the Firebase Console UI

3. **CI/CD Pipelines**: Update your deployment pipelines to use the new environment variable approach.

## Timeline

- **Before March 2026**: Complete migration
- **After March 2026**: `functions.config()` API will stop working

## Summary

Your project is already well-positioned for the migration. Since you're not using `functions.config()` in your codebase, you only need to:

1. Verify no legacy configuration exists
2. Ensure all team members are aware of the migration
3. Update any deployment documentation
4. Monitor Firebase release notes for any updates

No code changes are required in your current codebase.

## Testing and Verification

1. Run `npm run check-firebase-config` to verify no legacy configuration exists
2. Run `firebase emulators:start` to test the new environment variable setup
3. Verify that all functions load correctly without errors

## Troubleshooting Environment Variable Issues

If you encounter issues with environment variable loading:

1. **Reserved Prefixes**: Firebase rejects environment variables that start with reserved prefixes like `FIREBASE_`, `X_GOOGLE_`, or `EXT_`. Rename these variables to avoid the prefixes.
   
   **Example**:
   ```env
   # Instead of this (will cause errors):
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
   
   # Use this (without reserved prefixes):
   PROJECT_ID=your-project-id
   AUTH_EMULATOR_HOST=localhost:9099
   ```

2. **Setting Emulator Variables**: For emulator variables, set them in your code after loading dotenv:
   ```javascript
   // Set Firebase emulator environment variables if they exist
   if (process.env.AUTH_EMULATOR_HOST) {
     process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.AUTH_EMULATOR_HOST;
   }
   if (process.env.STORAGE_EMULATOR_HOST) {
     process.env.FIREBASE_STORAGE_EMULATOR_HOST = process.env.STORAGE_EMULATOR_HOST;
   }
   ```

3. **Validation**: Update your environment validation code to use the new variable names without reserved prefixes.
