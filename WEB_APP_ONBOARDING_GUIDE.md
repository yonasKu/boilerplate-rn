# 🌱 SproutBook Web App Onboarding Guide

## Overview
This guide explains how users sign up on the web app and seamlessly transition to the mobile app with proper email verification and account setup.

---

## 🚀 Complete User Journey

### **Step 1: Web Signup** 
**Location:** `sproutbook.com/signup`

**Process:**
1. User fills signup form (Name, Email, Password)
2. Account created in Firebase Auth + Firestore
3. **Email verification email sent automatically**
4. User redirected to **Email Verification Screen**

### **Step 2: Email Verification**
**Location:** `sproutbook.com/verify-email`

**User Actions:**
- ✅ **Check email inbox** for verification link
- 🔁 **Resend email** (if needed)
- ✅ **Confirm verification** before proceeding
- 🚀 **Continue to Pricing** after verification

### **Step 3: Pricing & Subscription**
**Location:** `sproutbook.com/pricing`

**Process:**
- User selects subscription plan
- Payment processed via Stripe
- Subscription status updated in Firestore

### **Step 4: Success & App Download**
**Location:** `sproutbook.com/success`

**Actions:**
- ✅ **Download app** links displayed (iOS/Android)
- ✅ **Login credentials** confirmation
- ✅ **Next steps** instructions

---

## 📱 Mobile App Connection

### **How Web & Mobile Connect**

#### **Firebase Authentication**
```
Web Signup → Firebase Auth → Mobile Login
```
- **Same credentials** work on both platforms
- **Email verification** status syncs automatically
- **User profile** data shared across platforms

#### **Firestore Data Sync**
```
Web Data → Firestore → Mobile App
```
- **User profile** (name, email, subscription)
- **Children profiles** created during onboarding
- **Journal entries** accessible on both platforms

#### **Real-time Synchronization**
- Changes on web **instantly appear** on mobile
- Offline support with **Firestore offline persistence**
- **Cross-platform notifications** via Firebase Cloud Messaging

---

## 🔐 Email Verification Flow

### **Technical Implementation**

#### **1. Automatic Email Sending**
```typescript
// After signup
await createUserWithEmailAndPassword(auth, email, password);
await sendEmailVerification(user);
```

#### **2. Verification Screen Features**
- **Resend email** button (with rate limiting)
- **Check verification status** button
- **Continue to pricing** only after verification
- **Back to login** option

#### **3. Security Rules**
```javascript
// Firestore rules include email verification checking
function isEmailVerified() {
  return request.auth.token.email_verified == true;
}
```

---

## 📋 User Checklist for Web → Mobile Transition

### **For Users:**
- [ ] Sign up on web app
- [ ] Check email and verify account
- [ ] Complete pricing selection
- [ ] Download mobile app (iOS/Android)
- [ ] Login with same email/password
- [ ] Complete mobile onboarding (add child details)

### **For Developers:**
- [ ] Ensure Firebase project is properly configured
- [ ] Test email verification flow end-to-end
- [ ] Verify cross-platform data sync
- [ ] Test password reset functionality
- [ ] Confirm subscription status syncs correctly

---

## 🔧 Technical Setup Requirements

### **Firebase Configuration**
```bash
# Required Firebase services:
✅ Authentication (Email/Password)
✅ Firestore Database
✅ Email Templates (enabled by default)
✅ Security Rules (configured)
```

### **Environment Variables**
```bash
# Web App needs:
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project

# Mobile App needs:
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project
```

---

## 📊 Testing Checklist

### **Web App Testing**
- [ ] Signup form validation
- [ ] Email verification delivery
- [ ] Verification link functionality
- [ ] Pricing page access after verification
- [ ] Payment processing

### **Mobile App Testing**
- [ ] Login with web credentials
- [ ] Profile data sync
- [ ] Subscription status verification
- [ ] Onboarding flow completion
- [ ] Cross-platform data consistency

### **Integration Testing**
- [ ] Real-time data sync
- [ ] Email verification status persistence
- [ ] Password reset across platforms
- [ ] Subscription management

---

## 🆘 Troubleshooting

### **Common Issues & Solutions**

#### **Email Not Received**
- Check spam/junk folder
- Verify email address spelling
- Use "Resend Email" button
- Check Firebase email quotas

#### **Verification Link Not Working**
- Ensure link clicked within 1 hour
- Check if already verified
- Try logging in to confirm status

#### **Mobile Login Issues**
- Verify same email/password used
- Check internet connection
- Ensure email verification completed
- Clear app cache if needed

#### **Data Not Syncing**
- Check Firebase project configuration
- Verify Firestore rules
- Test with fresh account
- Check network connectivity

---

## 📞 Support Contact

### **For Users:**
- **Email:** support@sproutbook.com
- **Help Center:** sproutbook.com/help
- **Live Chat:** Available during business hours

### **For Developers:**
- **Firebase Console:** console.firebase.google.com
- **Documentation:** firebase.google.com/docs
- **Community:** Stack Overflow (firebase tag)

---

## 🔄 Continuous Integration

### **Automated Testing**
- **Email delivery** testing with Firebase Emulator
- **Cross-platform** login testing
- **Data synchronization** validation
- **Security rules** testing

### **Monitoring**
- **Email delivery rates** via Firebase Analytics
- **User onboarding** funnel tracking
- **Cross-platform** usage metrics
- **Error rates** and performance monitoring

---

**Last Updated:** August 3, 2025
**Version:** 1.0.0
**Status:** Production Ready
