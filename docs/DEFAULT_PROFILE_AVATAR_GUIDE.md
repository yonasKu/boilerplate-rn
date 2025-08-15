# Default Profile Avatar Implementation Guide

## Overview
This guide explains how to implement default profile avatars that display the first letter of the username with a random background color when users haven't uploaded a profile picture.

## Installation Requirements

### No additional packages needed
This implementation uses React Native's built-in components and requires no additional installations.

## Implementation Steps

### 1. Create Avatar Utility Functions

Create a new file `src/utils/avatarUtils.ts`:

```typescript
// src/utils/avatarUtils.ts

export const generateAvatarColor = (name: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#10AC84', '#EE5A24', '#0652DD', '#9980FA', '#D63031'
  ];
  
  // Generate a hash from the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Return a color based on the hash
  return colors[Math.abs(hash) % colors.length];
};

export const getInitials = (name: string): string => {
  if (!name || name.trim() === '') return '?';
  return name.charAt(0).toUpperCase();
};

export const generateAvatarStyle = (name: string) => {
  const backgroundColor = generateAvatarColor(name);
  return {
    backgroundColor,
    justifyContent: 'center',
    alignItems: 'center',
  };
};
```

### 2. Create Default Avatar Component

Create a new component `src/components/DefaultAvatar.tsx`:

```typescript
// src/components/DefaultAvatar.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { generateAvatarStyle, getInitials } from '../utils/avatarUtils';

interface DefaultAvatarProps {
  name: string;
  size?: number;
  textSize?: number;
}

export const DefaultAvatar: React.FC<DefaultAvatarProps> = ({
  name,
  size = 50,
  textSize = 20,
}) => {
  const avatarStyle = generateAvatarStyle(name);
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.container,
        avatarStyle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.text, { fontSize: textSize }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
```

### 3. Create Profile Avatar Component

Create a new component `src/components/ProfileAvatar.tsx`:

```typescript
// src/components/ProfileAvatar.tsx

import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { DefaultAvatar } from './DefaultAvatar';

interface ProfileAvatarProps {
  imageUrl?: string | null;
  name: string;
  size?: number;
  textSize?: number;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  imageUrl,
  name,
  size = 50,
  textSize = 20,
}) => {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      />
    );
  }

  return (
    <DefaultAvatar
      name={name}
      size={size}
      textSize={textSize}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    // Add any container styles if needed
  },
});
```

### 4. Implementation in Main App Screens

The default avatar should only be used in the main app screens (after user login), not in the auth flow. Here's how to implement it in the main sections:

#### Update Journal Screen Header

In your journal or profile screens within the main app:

```typescript
// src/features/journal/components/ProfileHeader.tsx
import { ProfileAvatar } from '../../../components/ProfileAvatar';

export const ProfileHeader = ({ user }) => (
  <View style={styles.header}>
    <ProfileAvatar
      imageUrl={user.profileImage}
      name={user.name}
      size={60}
      textSize={24}
    />
    <Text style={styles.userName}>{user.name}</Text>
  </View>
);
```

#### Update Settings Screen

```typescript
// src/features/settings/screens/SettingsScreen.tsx
import { ProfileAvatar } from '../../../components/ProfileAvatar';

export const SettingsScreen = () => {
  const { user } = useAuth();
  
  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <ProfileAvatar
          imageUrl={user?.profileImage}
          name={user?.name || 'User'}
          size={80}
          textSize={32}
        />
        <Text style={styles.userName}>{user?.name}</Text>
      </View>
    </View>
  );
};
```

#### Update Navigation Header

```typescript
// src/components/NavigationHeader.tsx
import { ProfileAvatar } from './ProfileAvatar';

export const NavigationHeader = ({ user }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={() => navigation.navigate('profile')}>
      <ProfileAvatar
        imageUrl={user.profileImage}
        name={user.name}
        size={40}
        textSize={16}
      />
    </TouchableOpacity>
  </View>
);
```

### 6. Usage in Other Components

#### Using ProfileAvatar in any component:

```typescript
import { ProfileAvatar } from '../components/ProfileAvatar';

// Basic usage
<ProfileAvatar name="John Doe" />

// With image URL
<ProfileAvatar 
  imageUrl={user.profileImage} 
  name={user.name} 
  size={60} 
  textSize={24} 
/>

// Different sizes
<ProfileAvatar name="Jane Smith" size={40} textSize={16} />
<ProfileAvatar name="Bob Johnson" size={80} textSize={32} />
```

### 7. Firebase Integration

When saving user data to Firebase:

```typescript
// In your user service
export const saveUserProfile = async (userId: string, userData: any) => {
  const profileData = {
    ...userData,
    // Only save profileImage if it exists
    profileImage: userData.profileImage || null,
    // Store the user's name for avatar generation
    displayName: userData.name,
  };

  await setDoc(doc(db, 'users', userId), profileData);
};
```

### 8. Testing the Implementation

#### Test cases to verify:

1. **No image uploaded**: Should display colored circle with first letter
2. **Image uploaded**: Should display the uploaded image
3. **Different names**: Should generate different colors for different names
4. **Empty name**: Should display '?' as fallback
5. **Different sizes**: Should scale properly

#### Example test code:

```typescript
// Test component
import React from 'react';
import { View } from 'react-native';
import { ProfileAvatar } from '../components/ProfileAvatar';

const TestAvatars = () => (
  <View>
    <ProfileAvatar name="Alice" />
    <ProfileAvatar name="Bob" />
    <ProfileAvatar name="Charlie" />
    <ProfileAvatar name="Diana" />
    <ProfileAvatar name="" />
  </View>
);
```

## Benefits

1. **Consistent User Experience**: All users have avatars, even without uploads
2. **Performance**: No external image loading for default avatars
3. **Accessibility**: Clear visual identification for all users
4. **Scalability**: Easy to implement across the entire app
5. **Customization**: Colors are deterministic based on name

## Troubleshooting

### Common Issues and Solutions

1. **Avatar not showing**: Ensure name prop is provided
2. **Wrong color**: Check the generateAvatarColor function
3. **Size issues**: Verify size and textSize props
4. **Image not loading**: Check imageUrl format (should be valid URI)

### Debug Helper

Add this debug component:

```typescript
// src/components/DebugAvatar.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { generateAvatarColor } from '../utils/avatarUtils';

export const DebugAvatar = ({ name }: { name: string }) => (
  <View>
    <Text>Name: {name}</Text>
    <Text>Color: {generateAvatarColor(name)}</Text>
  </View>
);
```

## Next Steps

1. Implement the components as shown
2. Test with different names and sizes
3. Integrate into existing profile screens
4. Add to navigation headers where user avatars appear
5. Consider adding animation for avatar transitions
