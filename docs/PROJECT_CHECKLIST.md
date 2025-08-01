# SproutBook Project: Overall Task Checklist

This document tracks the overall progress of the SproutBook application development.

---

### Core Application Setup
- [x] **Project Scaffolding:** Initial React Native with Expo project setup.
- [x] **Navigation:** Implemented Expo Router for app navigation.
- [x] **UI Foundation:** Basic UI components and theme are in place.
- [x] **Onboarding Flow:** Created the initial onboarding screen.

### Firebase Integration
- [x] **Project Setup:** Created and configured the Firebase project.
- [x] **SDK Installation:** Installed the Firebase SDK.
- [x] **Environment Setup:** Configured `.env` for secure API key management.
- [x] **Firebase Config:** Created `firebaseConfig.ts` to initialize services.
- [x] **Authentication Service:** Enabled Email/Password, Google, and Apple providers in the Firebase console.
- [x] **Firestore Setup:** Configured Firestore with initial security rules.
- [x] **Storage Setup:** Configured Cloud Storage with initial security rules.
- [x] **AuthContext Integration:** Refactored `AuthContext.tsx` to use Firebase.
- [x] **Routing Logic:** Updated `_layout.tsx` to handle auth state.
- [x] **Email/Password Sign-Up:** Implemented the sign-up logic in `SignUpScreen.tsx`.
- [x] **Email/Password Login:** Implemented the login logic in `LoginScreen.tsx`.
- [ ] **Social Logins:** Implement Google and Apple Sign-In.

### Feature Development
- [ ] **Journaling:**
    - [ ] Create/Edit/Delete Journal Entries.
    - [ ] Add Photos/Videos to entries.
- [ ] **Child Profiles:**
    - [ ] Create/Edit/Delete child profiles.
- [ ] **AI Recaps (OpenAI):**
    - [ ] Integrate OpenAI API.
    - [ ] Develop function to generate recaps.
- [ ] **Monetization (RevenueCat/Stripe):**
    - [ ] Set up subscription plans.
    - [ ] Integrate payment SDK.
- [ ] **Push Notifications (Expo Notifications):**
    - [ ] Configure push notification service.
    - [ ] Implement notifications for key events.

### Admin Dashboard (Next.js)
- [ ] **Project Setup:** Initialize Next.js project.
- [ ] **UI:** Build with shadcn/ui.
- [ ] **Functionality:** Develop features for managing users and content.
