# SproutBook Signup/Login Flow & Profile Image Upload Analysis

## 📋 Current Signup/Login Flow Analysis

### **Current Flow Overview**
```
Welcome Screen → SignUp Screen → Verify Email → Pricing → Checkout → Success → Login → Add Profile → Add Child Details → Main App
```

### **Detailed Flow Breakdown**

#### **1. Welcome Screen** (`/welcome`)
- **Purpose**: Initial app introduction
- **Features**: App overview, CTA buttons
- **Navigation**: SignUp → `/signup`

#### **2. SignUp Screen** (`/signup`)
- **Purpose**: User registration
- **Current Fields**: Name, Email, Password
- **Features**: Email/password + Google SignIn
- **Navigation**: Success → `/verify-email`

#### **3. Verify Email Screen** (`/verify-email`)
- **Purpose**: Email verification
- **Features**: Resend email functionality
- **Navigation**: Continue → `/pricing`

#### **4. Pricing Screen** (`/pricing`)
- **Purpose**: Subscription selection
- **Features**: Plan comparison, selection
- **Navigation**: Selected → `/checkout`

#### **5. Checkout Screen** (`/checkout`)
- **Purpose**: Payment processing
- **Features**: Payment form, plan confirmation
- **Navigation**: Success → `/success`

#### **6. Success Screen** (`/success`)
- **Purpose**: Confirmation
- **Navigation**: Continue → `/login`

#### **7. Login Screen** (`/login`)
- **Purpose**: User authentication
- **Features**: Email/password + Google SignIn
- **Navigation**: Success → `/add-profile`

#### **8. Add Profile Screen** (`/add-profile`)
- **Purpose**: User profile setup
- **Current Fields**: Name (readonly), Email (readonly), Lifestage
- **Features**: Static avatar placeholder
- **Navigation**: Continue → `/add-child-details`

#### **9. Add Child Details Screen** (`/add-child-details`)
- **Purpose**: Child profile creation
- **Current Fields**: Name, DOB, Gender
- **Features**: No image upload currently
- **Navigation**: Complete → `/main/(tabs)/journal`

---

## 🔍 Missing Profile Image Upload Features

### **Current Missing Features**
1. **User Profile Image Upload** - No image upload in Add Profile screen
2. **Child Profile Image Upload** - No image upload in Add Child Details screen
3. **Image Storage Rules** - No dedicated storage rules for profile images
4. **Image Preview/Selection** - No image picker integration
5. **Image Upload Service** - No profile image upload methods

### **Required Storage Structure**
```
storage/
├── journal_media/          ✅ Existing for journal entries
├── profile_images/         🆕 For user profiles
├── child_images/           🆕 For child profiles
└── temp_uploads/           🆕 For processing
```

---

## 🎯 Implementation Plan for Profile Image Upload

### **Phase 1: Storage Rules Update**
- Add new storage paths for profile images
- Set appropriate file size limits (5MB for profile images)
- Ensure authenticated user access only

### **Phase 2: Add Profile Screen Enhancement**
- Add image picker functionality
- Add image preview and upload
- Update user document with profile image URL

### **Phase 3: Add Child Details Enhancement**
- Add child image picker
- Add image preview and upload
- Update child document with image URL

### **Phase 4: Service Layer Updates**
- Add profile image upload service methods
- Add child image upload service methods
- Add image deletion on profile/child deletion

### **Phase 5: UI/UX Integration**
- Update avatar placeholders with uploaded images
- Add loading states for image uploads
- Add error handling for failed uploads

---

## 🚀 Technical Implementation Details

### **Storage Rules Addition**
```javascript
// Add to storage.rules
match /profile_images/{userId} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.uid == userId
    && request.resource.contentType.matches('image/.*')
    && request.resource.size < 5 * 1024 * 1024;
}

match /child_images/{childId} {
  allow read: if true;
  allow write: if request.auth != null
    && request.resource.contentType.matches('image/.*')
    && request.resource.size < 5 * 1024 * 1024;
}
```

### **Service Methods to Add**
```typescript
// In userService.ts
export const uploadUserProfileImage = async (userId: string, imageUri: string): Promise<string> => { ... }
export const uploadChildProfileImage = async (childId: string, imageUri: string): Promise<string> => { ... }
```

### **UI Components to Update**
1. **AddProfileScreen** - Add image picker to avatar section
2. **AddChildDetailsScreen** - Add image picker for child avatar
3. **ProfileScreen** - Display uploaded profile images
4. **Child-related components** - Display child profile images

---

## 📊 Impact Assessment

### **User Experience Benefits**
- **Personalization**: Users can add personal photos
- **Child Recognition**: Easy identification of children
- **Professional Look**: Consistent profile image system
- **Social Features**: Profile images in shared content

### **Technical Considerations**
- **Storage Costs**: Profile images are small (5MB limit)
- **Performance**: Cached images for fast loading
- **Security**: Proper access controls in place
- **Scalability**: Organized storage structure

---

## ✅ Next Steps Priority

1. **Immediate**: Update storage rules for profile images
2. **High**: Implement Add Profile screen image upload
3. **High**: Implement Add Child Details screen image upload
4. **Medium**: Add service methods for image handling
5. **Low**: Add image optimization and caching

The foundation is solid - we can leverage the existing journal media upload infrastructure for profile image functionality.
