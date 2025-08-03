# Navigation Structure Documentation

## Overview
This Expo Router application uses a hybrid navigation structure combining **Tab Navigation** for main screens and **Stack Navigation** for individual screens.

## Current Structure Issues
⚠️ **Problem**: Custom bottom tab appears on ALL screens within the `(main)` folder instead of only the 4 main tab screens.

## Correct Navigation Structure

### 1. Main Tab Screens (Custom Bottom Tab)
These screens should show the custom bottom tab:
- **`journal`** - Home/Journal screen
- **`recaps`** - Recaps screen  
- **`search`** - Search screen
- **`new`** - New Entry screen

### 2. Individual Stack Screens (No Bottom Tab)
These screens should NOT show the custom bottom tab:
- **`settings`** - Settings screen
- **`profile`** - My Profile screen
- **`account-settings`** - Account settings
- **`child-profiles`** - Child profiles management
- **`partner-access`** - Partner access management
- **`refer-a-friend`** - Referral program
- **`notifications`** - Notifications screen

## Required Fix

### Current (Incorrect) Structure
```typescript
// src/app/(main)/_layout.tsx
<Tabs tabBar={props => <CustomTabBar {...props} />}>
  <Tabs.Screen name="journal" />
  <Tabs.Screen name="recaps" />
  <Tabs.Screen name="search" />
  <Tabs.Screen name="new" />
  <Tabs.Screen name="settings" options={{ href: null }} /> // Still renders tab bar
</Tabs>
```

### Correct Structure
```typescript
// src/app/(main)/_layout.tsx - Stack Navigator
import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" /> {/* Contains tab screens */}
      <Stack.Screen name="settings" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="account-settings" />
      <Stack.Screen name="child-profiles" />
      <Stack.Screen name="partner-access" />
      <Stack.Screen name="refer-a-friend" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}

// src/app/(main)/(tabs)/_layout.tsx - Tab Navigator
import { Tabs } from 'expo-router';
import CustomTabBar from '../../../components/ui/CustomTabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={props => <CustomTabBar {...props} />}>
      <Tabs.Screen name="journal" options={{ title: 'Home' }} />
      <Tabs.Screen name="recaps" options={{ title: 'Recaps' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="new" options={{ title: 'New' }} />
    </Tabs>
  );
}
```

## File Structure Changes Needed

### Move tab screens to separate folder:
```
src/app/
├── (main)/
│   ├── _layout.tsx          # Stack navigator
│   ├── (tabs)/              # Tab navigation folder
│   │   ├── _layout.tsx      # Tab navigator
│   │   ├── journal.tsx      # Home tab
│   │   ├── recaps.tsx       # Recaps tab
│   │   ├── search.tsx       # Search tab
│   │   └── new.tsx          # New Entry tab
│   ├── settings.tsx         # Individual screen (no tab)
│   ├── profile.tsx          # Individual screen (no tab)
│   └── ...                  # Other individual screens
```

## CustomTabBar Configuration

### Current Visible Routes:
```typescript
const visibleRoutes = ['journal', 'recaps', 'search', 'new'];
```

### Route Icons:
- `journal` → 'home'
- `recaps` → 'book-open'
- `search` → 'search'
- `new` → 'plus-circle' (add if needed)

## Implementation Steps

1. **Create (tabs) folder** under (main)
2. **Move tab screens** to (tabs) folder
3. **Update (main)/_layout.tsx** to use Stack instead of Tabs
4. **Create new (tabs)/_layout.tsx** for tab navigation
5. **Update navigation paths** in the app

## Navigation Patterns

### Tab Navigation (Custom Bottom Tab)
- **Purpose**: Main app navigation
- **Screens**: 4 core features
- **Behavior**: Always visible on these screens

### Stack Navigation (No Tab)
- **Purpose**: Individual feature screens
- **Screens**: Settings, Profile, etc.
- **Behavior**: No bottom tab, back button navigation

## Usage Examples

### Navigating from Tab Screen to Individual Screen:
```typescript
// From Journal screen to Settings
import { useRouter } from 'expo-router';
const router = useRouter();
router.push('/(main)/settings');
```

### Navigating between tabs:
```typescript
// Within tab screens
import { useNavigation } from '@react-navigation/native';
const navigation = useNavigation();
navigation.navigate('recaps');
```
