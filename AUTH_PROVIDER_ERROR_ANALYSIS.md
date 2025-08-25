# AuthProvider Error Analysis & Troubleshooting Guide

## Error Analysis: "useAuth must be used within an AuthProvider"

### Root Cause Identification
The error occurs when `useAuth()` hook is called outside the `<AuthProvider>` component tree. This is a React Context error that prevents the hook from accessing the authentication context.

### Current Architecture Review

#### ✅ **Correct Implementation**
- **AuthContext.tsx**: Properly exports `AuthProvider` and `useAuth` hook
- **Root Layout**: `RootLayoutNav` correctly wraps content with `<AuthProvider>`
- **File Structure**: Located at `src/context/AuthContext.tsx` following project conventions

#### ⚠️ **Potential Issue Areas**

1. **Component Import Chain**: The `useLogin` hook in `useLogin.ts` does NOT use `useAuth`, which is correct
2. **Layout Structure**: `_layout.tsx` uses `useAuth` within `InitialLayout` which is properly nested under `AuthProvider`
3. **Route Groups**: All screens should be covered by the root provider

### Common Causes & Solutions

#### 1. **Missing AuthProvider in Component Tree**
**Symptoms**: Error occurs in specific screens
**Solution**: Ensure all route groups are covered

```tsx
// Check if any screen is rendered outside AuthProvider
// All screens should be children of RootLayoutNav
```

#### 2. **Incorrect Import Path**
**Symptoms**: Error in specific files
**Solution**: Verify import statements

```tsx
// ✅ Correct
import { useAuth } from '../context/AuthContext';

// ❌ Wrong - direct import from context file
import { useAuth } from './context/AuthContext';
```

#### 3. **Conditional Rendering Issues**
**Symptoms**: Error during navigation transitions
**Solution**: Check conditional rendering logic

### Diagnostic Steps

#### Step 1: Verify Provider Coverage
```bash
# Check all files using useAuth
grep -r "useAuth()" src/ --include="*.tsx" --include="*.ts"
```

#### Step 2: Check Import Paths
```bash
# Verify import statements
grep -r "from.*context.*AuthContext" src/ --include="*.tsx" --include="*.ts"
```

#### Step 3: Test Provider Hierarchy
Add debug logging to verify provider coverage:

```tsx
// In _layout.tsx, add debug logging
console.log('AuthProvider mounted:', !!AuthProvider);
console.log('InitialLayout rendered with AuthProvider');
```

### Quick Fixes

#### Fix 1: Ensure All Screens Covered
Verify that all route screens are children of the AuthProvider:

```tsx
// In _layout.tsx - already implemented correctly
<AuthProvider>
  <OnboardingProvider>
    <InitialLayout /> {/* All screens rendered here */}
  </OnboardingProvider>
</AuthProvider>
```

#### Fix 2: Check Component Usage
Ensure `useAuth` is only called within React components:

```tsx
// ✅ Correct - inside component
const MyComponent = () => {
  const { user } = useAuth();
  return <Text>{user?.email}</Text>;
};

// ❌ Wrong - outside component
const { user } = useAuth(); // This will throw error
```

#### Fix 3: Verify Navigation Structure
Check if any screens bypass the root layout:

```bash
# Check for any direct navigation that might skip providers
find src/ -name "*.tsx" -exec grep -l "router\.replace\|router\.push" {} \;
```

### Testing the Fix

#### Test 1: Provider Validation
Add this debug component to verify provider coverage:

```tsx
// Add to any screen temporarily
const AuthProviderTest = () => {
  try {
    const auth = useAuth();
    console.log('AuthProvider working:', !!auth.user);
    return null;
  } catch (error) {
    console.error('AuthProvider error:', error.message);
    return <Text>Error: {error.message}</Text>;
  }
};
```

#### Test 2: Import Path Verification
Create a test file to verify imports:

```tsx
// test-auth.tsx
import { useAuth } from '../context/AuthContext';

export const TestAuth = () => {
  const auth = useAuth();
  return <Text>User: {auth.user?.email || 'No user'}</Text>;
};
```

### Prevention Guidelines

1. **Always wrap new screens** with existing providers
2. **Use relative imports** for context files
3. **Test navigation flows** after adding new routes
4. **Check error boundaries** for graceful handling

### Common Mistakes to Avoid

- **Don't** call `useAuth` in utility functions
- **Don't** import context files with incorrect paths
- **Don't** conditionally render providers
- **Don't** nest providers incorrectly

### Migration Checklist

- [ ] All screens use correct import paths
- [ ] No components call `useAuth` outside provider tree
- [ ] Navigation flows maintain provider coverage
- [ ] Error boundaries handle auth context errors gracefully

### Emergency Fallback

If the error persists, add a temporary wrapper:

```tsx
// In problematic files, add explicit provider
const SafeComponent = () => {
  return (
    <AuthProvider>
      <YourComponent />
    </AuthProvider>
  );
};
```

**Note**: This is a temporary fix - the root cause should be identified and fixed properly.
