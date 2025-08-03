# Profile Photo Upload Implementation Plan

## Current Status Analysis
- ✅ Email verification flow is working correctly
- ✅ User stays signed in after signup
- ✅ Verification screen checks email status and navigates to pricing
- 🔄 **Next**: Profile photo upload after verification

## Profile Photo Upload Options & Configuration

### 1. Firebase Storage (Recommended)
**Setup Requirements:**
```bash
# Install dependencies
npm install expo-image-picker
npm install @react-native-firebase/storage  # or firebase/storage for web
```

**Firebase Console Setup:**
1. Go to Firebase Console → Storage
2. Click "Get started" → Start in test mode
3. Set rules (development):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 2. Implementation Approaches

#### Option A: Direct Firebase Storage Upload
**Flow:**
- User selects photo → Uploads to Firebase Storage → Gets URL → Saves to Firestore

**Code Structure:**
```typescript
// Storage path: profile-photos/{userId}/profile.jpg
// Max size: 2MB
// Allowed formats: JPG, PNG, WebP
```

#### Option B: Cloudinary Integration (Alternative)
**Setup:**
- Sign up at cloudinary.com
- Install: `npm install cloudinary-react-native`
- Better for image transformations

#### Option C: Expo Image Picker + Base64 (Simple)
- Uses Expo's built-in image picker
- Converts to base64 for small images
- Limited to small file sizes

### 3. User Experience Flow

```
Verification Complete → Add Profile Photo Screen
├── Take Photo (Camera)
├── Choose from Gallery
├── Skip for Now
└── Upload & Continue
```

### 4. Technical Requirements

#### Dependencies Needed:
```json
{
  "expo-image-picker": "~14.3.2",
  "firebase/storage": "^10.7.1",
  "react-native-image-resizer": "^1.4.5"  // Optional for compression
}
```

#### File Structure:
```
src/features/profile/
├── components/
│   ├── ProfilePhotoUpload.tsx
│   └── PhotoCropper.tsx
├── screens/
│   └── AddProfilePhotoScreen.tsx
└── hooks/
    └── usePhotoUpload.ts
```

### 5. Configuration Steps

#### Step 1: Enable Firebase Storage
1. Firebase Console → Storage → Create bucket
2. Set location (us-central1 recommended)
3. Configure CORS for web support

#### Step 2: Update Firestore Rules
```javascript
// Add to firestore.rules
match /users/{userId} {
  allow update: if request.auth != null && 
                request.auth.uid == userId &&
                request.resource.data.keys().hasOnly(['profilePhotoUrl', 'updatedAt']);
}
```

#### Step 3: Environment Variables
```bash
# Add to .env
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### 6. Implementation Complexity Levels

#### Level 1: Basic Upload (30 mins)
- Simple image picker
- Direct upload to Firebase
- Basic error handling

#### Level 2: Enhanced (1 hour)
- Image compression
- Loading states
- Error handling
- Progress indicators

#### Level 3: Advanced (2 hours)
- Multiple image sizes (thumbnail, medium, full)
- Image editing/cropping
- Offline support
- Retry mechanisms

### 7. Security Considerations

- **File size limits**: 2MB max
- **File types**: Only images (JPG, PNG, WebP)
- **User authentication**: Only authenticated users can upload
- **Path validation**: Ensure user can only upload to their own folder
- **Virus scanning**: Firebase Storage has built-in scanning

### 8. Testing Strategy

#### Manual Testing:
1. Test with different image sizes
2. Test network failures
3. Test permission denials
4. Test concurrent uploads

#### Automated Testing:
- Mock Firebase Storage
- Test upload success/failure scenarios
- Test image validation

### 9. Performance Optimization

- **Image compression** before upload
- **Lazy loading** for display
- **CDN caching** via Firebase Storage
- **Progressive loading** with blur placeholders

### 10. Next Steps

Choose your implementation level:
- [ ] **Level 1**: Basic upload functionality
- [ ] **Level 2**: Enhanced with compression and error handling
- [ ] **Level 3**: Advanced with editing and optimization

**Recommendation**: Start with Level 1 for MVP, then enhance based on user feedback.
