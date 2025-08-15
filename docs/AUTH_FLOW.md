# Authentication Flow Explained

This document outlines the current user authentication flow in the SproutBook app and proposes a more secure, professional flow that should be implemented before a public launch.

---

## Current Flow (Simplified, Not for Production)

The current implementation is designed for simplicity during early development. It allows for easy account creation without any verification steps.

**Steps:**

1.  **User Signs Up**: A user provides their first name, last name, email, and password.
2.  **Instant Account Creation**: The `createUserWithEmailAndPassword` function is called.
    - A new user account is immediately created and enabled in **Firebase Authentication**.
    - A corresponding user profile document is instantly created in the **Firestore `users` collection**.
3.  **No Verification**: No email is sent to the user to confirm they own the email address. The system trusts the user's input completely.
4.  **Immediate Full Access**: The user is logged in right away and can access all features of the app.

**Problems with this flow:**
- **Security Risk**: Anyone can sign up with an email address they don't own, including fake or temporary emails.
- **Spam and Abuse**: This makes the app vulnerable to bots and malicious users creating fake accounts.
- **Data Integrity**: The `users` collection can get filled with unverified, useless data.

---

## Proposed Professional Flow (Recommended)

This flow incorporates email verification, which is a standard security practice for modern applications.

**Steps:**

1.  **User Signs Up**: The user provides their details as before.
2.  **Account Created & Verification Email Sent**: 
    - The `createUserWithEmailAndPassword` function is called, creating the user in Firebase Authentication.
    - **Crucially**, immediately after, the `sendEmailVerification` function is called. Firebase automatically sends a pre-formatted email to the user with a unique verification link.
3.  **User Verifies Email**: The user must open their inbox and click the verification link. This action updates their account status in Firebase to `emailVerified: true`.
4.  **Limited Access Until Verified**: 
    - The app should allow the user to log in, but it should check the `emailVerified` status of their account.
    - If the email is not verified, the app should restrict access. A common approach is to show a dedicated screen that says, "Please check your email to verify your account," with an option to resend the verification link.
    - Once the user has verified their email, they are granted full access to the app's features.

**Benefits of this flow:**
- **Enhanced Security**: Ensures that the user genuinely owns the email address they signed up with.
- **Reduces Spam**: Creates a significant barrier for bots and casual abusers.
- **Improves User Trust**: Users feel more secure knowing that proper verification processes are in place.
- **Better Data Quality**: Your `users` collection will contain only verified, legitimate users.
