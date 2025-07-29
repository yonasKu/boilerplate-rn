# SproutBook: Project Architecture

This document outlines the architecture for the SproutBook mobile application.

---

## 1. App Concept

A family journaling and memory-sharing platform focused on private, collaborative storytelling around children’s early years.

**Key Features:**
- Personal journals (timeline)
- Recaps and memory highlights
- Partner/family access & collaboration
- Detailed onboarding (including child profiles)
- Monetization via subscription
- Referrals for growth
- Notifications and engagement prompts

---

## 2. Professional Architecture: Feature-First

To ensure the codebase is scalable, maintainable, and easy for developers to work on, we will adopt a **Feature-First (or Modular) Architecture**. All code related to a specific feature (e.g., authentication, referrals, journaling) will be co-located.

```
/SproutBook
└── src/
    ├── app/                    # --- NAVIGATION (Expo Router)
    │   ├── (auth)/
    │   ├── (main)/
    │   └── _layout.tsx
    │
    ├── features/
    │   ├── auth/              # Login, signup, onboarding logic & screens
    │   ├── referral/          # Invite a friend, referral success
    │   ├── partnerAccess/     # Invite partner, partner onboarding
    │   ├── journal/           # Timeline, entries, filters
    │   └── ... (etc.)
    │
    ├── components/             # --- SHARED, REUSABLE UI
    │   ├── ui/                 # Pure UI elements: Button, Input, Card, Modal
    │   ├── layout/             # Structural components: Container, Spacer
    │   └── icons/              # Custom icon components
    │
    ├── hooks/                  # Global or shared hooks (e.g., useAppState)
    ├── store/                  # Zustand slices for global state
    ├── services/               # API clients (Supabase, Stripe, etc.)
    ├── lib/                    # Utility functions (date formatting, etc.)
    ├── constants/              # Enums, static values
    ├── types/                  # Global TypeScript types/interfaces
    ├── assets/                 # Fonts, images
    └── theme/                  # Design tokens: colors, spacing, typography
```

---

## 3. Navigation Strategy

Navigation will be handled by **Expo Router**, but it will be kept clean and separate from feature logic.

-   The `src/app/` directory defines the URL structure and navigation stacks.
-   The actual screen components that `app/` renders will be imported from the `src/features/` directory.
-   **Example:** The route `/login` will be created by the file `src/app/(auth)/login.tsx`. This file will simply import and export the actual login screen component from `src/features/auth/screens/LoginScreen.tsx`.

This keeps our routing declarative and our feature code encapsulated.

**Primary Navigation Stacks:**
1.  **(auth):** For unauthenticated users. Contains welcome, login, and sign-up screens.
2.  **(main):** For authenticated users. This will be a Tab Navigator containing the main features like Journal, Recaps, and Settings.

The root layout (`src/app/_layout.tsx`) will contain the logic to determine which stack to show based on the user's authentication status.
