# Environment Variable Fixes for Firebase Emulators

## Problem
Firebase emulators were failing to load environment variables from `.env` file with the error:
```
Failed to load environment variables from .env.
```

## Root Cause
Firebase rejects environment variables that start with reserved prefixes:
- `FIREBASE_`
- `X_GOOGLE_`
- `EXT_`
## Solution

### 1. Renamed Environment Variables

Changed these variables in `.env`:

**Before:**
```env
FIREBASE_PROJECT_ID=sproutbook-d0c8f
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
```

**After:**
```env
PROJECT_ID=sproutbook-d0c8f
AUTH_EMULATOR_HOST=localhost:9099
STORAGE_EMULATOR_HOST=localhost:9199
```

### 2. Updated Code References

Updated all code files to use the new variable names:

1. `index.js` - Updated debug logs and validation checks
2. `utils/environmentValidator.js` - Updated schema and validation functions
3. `firebaseAdmin.js` - Added code to set Firebase emulator variables

### 3. Firebase Emulator Variables

For emulator variables, we set them in code after loading dotenv:
```javascript
// Set Firebase emulator environment variables if they exist
if (process.env.AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.AUTH_EMULATOR_HOST;
}
if (process.env.STORAGE_EMULATOR_HOST) {
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = process.env.STORAGE_EMULATOR_HOST;
}
```

## Verification

After these changes, Firebase emulators start successfully:
```
i  functions: Loaded environment variables from .env.
✔  All emulators ready! It is now safe to connect your app.
```

## Files Updated

1. `.env` - Renamed environment variables
2. `index.js` - Updated variable references
3. `firebaseAdmin.js` - Added emulator variable setting
4. `utils/environmentValidator.js` - Updated validation schema
5. `FIREBASE_CONFIG_MIGRATION_GUIDE.md` - Documented the solution
6. `ENVIRONMENT_GUIDE.md` - Updated documentation

This fix resolves the environment variable loading issue while maintaining all functionality.
