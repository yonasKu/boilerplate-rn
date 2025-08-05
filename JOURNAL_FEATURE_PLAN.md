# SproutBook Journaling Feature: Detailed Implementation Plan

This document provides a detailed, step-by-step guide for implementing the journaling feature with Firebase, including setup, code examples, and security rules.

---

## Part 1: Firebase Backend Setup

Before writing any code, ensure your Firebase project is ready.

1.  **Enable Firestore**: 
    - Go to your Firebase Console.
    - Select your project.
    - In the left menu, click **Build > Firestore Database**.
    - Click **Create database** and start in **production mode**. This is important for security.
    - Choose a location for your database.

2.  **Enable Firebase Storage**:
    - In the left menu, click **Build > Storage**.
    - Click **Get started** and follow the prompts. Use the default security rules for now; we will update them later.

---

## Part 2: Updating Security Rules (Crucial)

**This is the most important step for securing your app's data.** Your current rules only protect the `users` collection. Without the rules below, anyone could read, change, or delete your users' journal entries.

1.  **Open `firestore.rules`** in your local project.
2.  **Add the following rules for the `journalEntries` collection**. This ensures that users can only ever access their own entries.

```
// firestore.rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // This rule protects user profile data.
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // NEW: This rule protects journal entry data.
    match /journalEntries/{entryId} {
      // A user can CREATE an entry if they are logged in and the entry's `userId` field matches their own ID.
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      
      // A user can READ, UPDATE, or DELETE an entry if they are logged in and they are the owner of that entry.
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

3.  **Deploy your new rules** by running this command in your terminal:
    ```sh
    firebase deploy --only firestore:rules
    ```

---

## Part 3: Updating Storage Security Rules (Crucial)

Just like with your database, you must secure your file storage. These rules ensure that only authenticated users can upload images and that they can't upload excessively large files.

1.  **Create a `storage.rules` file** in your project's root directory if it doesn't already exist.
2.  **Add the following rules** to the `storage.rules` file:

```
// storage.rules
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Match any file path within the 'journal_images' folder.
    match /journal_images/{imageId} {
      
      // Allow anyone to read images. This is required to display them in the app.
      allow read: if true;
      
      // Allow a user to WRITE (upload) an image only if:
      // 1. They are logged in.
      // 2. The file size is less than 5MB.
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

3.  **Deploy your new storage rules** by running this command in your terminal:
    ```sh
    firebase deploy --only storage
    ```

---

## Part 4: How Firestore Collections are Created

**You do not need to create collections manually.**

Firestore is a "schema-less" database. This means that the first time your app's code tries to add a document to a collection that doesn't exist, **Firestore will create that collection automatically.**

In our plan, the `journalEntries` collection will be created the very first time the `saveJournalEntry` function successfully runs.

---

## Part 5: Feature Implementation (with Code)

### Step 1: Implement Image Picker in `NewEntryScreen.tsx`

### Step 1: Create a `journalService.ts`

This file will handle all direct communication with Firebase, keeping our API logic separate from our application logic.

1.  Create a new file at `src/services/journalService.ts`.
2.  Add the following code:

```ts
// src/services/journalService.ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { firestore, storage } from '@/firebase/config'; // Your Firebase config
import { v4 as uuidv4 } from 'uuid';

// 1. Uploads an image to Firebase Storage
export const uploadImage = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const imageRef = ref(storage, `journal_images/${uuidv4()}`);
  
  await uploadBytes(imageRef, blob);
  return getDownloadURL(imageRef);
};

// 2. Saves a new journal entry to Firestore
export const createJournalEntry = async (entryData: object) => {
  await addDoc(collection(firestore, 'journalEntries'), {
    ...entryData,
    createdAt: serverTimestamp(),
  });
};

// 3. Fetches all journal entries for a specific user
export const fetchUserJournalEntries = async (userId: string) => {
  const q = query(
    collection(firestore, 'journalEntries'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

### Step 2: Create the `useJournal` Custom Hook

This hook will manage the state (entries, loading status, errors) and use the `journalService` to perform actions.

1.  Create a new file at `src/hooks/useJournal.ts`.
2.  Add the following code:

```ts
// src/hooks/useJournal.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import * as journalService from '@/services/journalService';

export const useJournal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch entries when the hook is used
  useEffect(() => {
    if (user) {
      journalService.fetchUserJournalEntries(user.uid)
        .then(setEntries)
        .catch(() => setError('Failed to fetch journal entries.'))
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  // Function to add a new entry
  const addEntry = async (entryData: { text: string; images: string[]; isFavorited: boolean; isMilestone: boolean; }) => {
    if (!user) throw new Error('User not authenticated');
    setIsLoading(true);
    try {
      // 1. Upload all images from local URIs
      const imageUrls = await Promise.all(
        entryData.images.map(uri => journalService.uploadImage(uri))
      );
      
      // 2. Create the entry with the returned URLs
      await journalService.createJournalEntry({
        userId: user.uid,
        ...entryData,
        images: imageUrls,
      });

      // 3. Refresh local state (optional, for immediate UI update)
      const updatedEntries = await journalService.fetchUserJournalEntries(user.uid);
      setEntries(updatedEntries);

    } catch (e) {
      setError('Failed to save entry.');
      throw e; // Re-throw to be caught in the component
    } finally {
      setIsLoading(false);
    }
  };

  return { entries, isLoading, error, addEntry };
};
```

### Step 3: Integrate with `NewEntryScreen.tsx`

Now, we connect our UI to the hook. The screen becomes very simple.

```tsx
// src/features/journal/screens/NewEntryScreen.tsx
import { useJournal } from '@/hooks/useJournal';
import { Alert } from 'react-native';
// ... other imports

// Inside the component
const { addEntry, isLoading } = useJournal();
const [entryText, setEntryText] = useState('');
const [images, setImages] = useState<string[]>([]); // This will hold local URIs
const [isFavorited, setIsFavorited] = useState(false);
const [isMilestone, setIsMilestone] = useState(false);

// Image picker logic remains the same...

const handleSave = async () => {
  try {
    await addEntry({ text: entryText, images, isFavorited, isMilestone });
    router.back();
  } catch (error) {
    Alert.alert('Error', 'Could not save your entry.');
  }
};

// Use `isLoading` from the hook to show a spinner.
// The save button's onPress should call `handleSave`.
```

### Step 4: Integrate with `JournalScreen.tsx`

Finally, we update the main journal screen to display the entries from our hook.

```tsx
// src/features/journal/screens/JournalScreen.tsx
import { useJournal } from '@/hooks/useJournal';
import { FlatList, ActivityIndicator, Text } from 'react-native';

// Inside the component
const { entries, isLoading, error } = useJournal();

if (isLoading) {
  return <ActivityIndicator />;
}

if (error) {
  return <Text>{error}</Text>;
}

return (
  <FlatList
    data={entries}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <JournalEntryCard entry={item} />}
  />
);
```
