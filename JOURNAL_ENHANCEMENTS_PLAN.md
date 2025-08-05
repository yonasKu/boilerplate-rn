# SproutBook Journal Enhancements Plan

This document outlines the implementation plan for enhancing the SproutBook journaling feature based on the new requirements. Our goal is to create a more interactive, personal, and feature-rich journaling experience.

---

### Core Features To Be Implemented:

1.  **Tagging**: Mark entries as "Favorite" or "Milestone".
2.  **Age Calculation**: Automatically tag each entry with the child's age at the time of posting.
3.  **Likes/Engagement**: Allow users to "like" a post.
4.  **Editing/Deleting**: Provide the ability to edit or delete past entries.
5.  **Filtering**: Filter the journal timeline by age or tags.
6.  **Video Support**: Allow users to upload videos in addition to photos.

---

### 1. Data Model & Firebase Rules

**A. `journalEntries` Collection Schema Update:**

We will update the document structure to include the new fields. The `images` field will be replaced by a more generic `media` array.

```json
{
  "userId": "string",
  "childId": "string", // To link to the specific child for age calculation
  "text": "string",
  "createdAt": "timestamp",
  "isFavorited": false, // boolean for Favorite tag
  "isMilestone": false, // boolean for Milestone tag
  "childAgeAtEntry": "string", // e.g., "1 year, 2 months, 5 days"
  "media": [
    { "type": "image", "url": "..." },
    { "type": "video", "url": "...", "thumbnailUrl": "..." }
  ],
  "likes": {
    // A map of user IDs who have liked the post
    // e.g., { "userId1": true, "userId2": true }
  }
}
```

**B. Firebase Security Rules (`firestore.rules`):**

- **Create**: Users can only create entries for themselves (`request.auth.uid == request.resource.data.userId`).
- **Read**: Users can read their own entries.
- **Update**: 
    - The entry owner can edit `text`, `media`, `isFavorited`, and `isMilestone`.
    - Any authenticated user can update the `likes` map (to add or remove their own ID), but not other fields.
- **Delete**: Only the entry owner can delete their post.

---

### 2. Backend Logic (Services & Hooks)

**A. `journalService.ts` Updates:**

- **`createJournalEntry`**: Will be updated to accept `isFavorited` and `isMilestone` toggles. It will also fetch the child's birthdate to calculate and store the `childAgeAtEntry` string.
- **`updateJournalEntry(entryId, data)`**: New function to handle editing text or toggling the Favorite/Milestone tags.
- **`deleteJournalEntry(entryId)`**: New function to delete a Firestore document and its associated media from Firebase Storage.
- **`toggleLike(entryId, userId)`**: New function that uses a transaction to safely add or remove a user's ID from the `likes` map.

**B. `useJournal.ts` Hook Updates:**

The hook will be expanded to expose the new service functions to the UI.

- `addEntry(data)`: Will be updated to pass the new tag data.
- `updateEntry(entryId, data)`: New function.
- `deleteEntry(entryId)`: New function.
- `toggleLike(entryId)`: New function.

---

### 3. UI/UX Implementation Plan

**A. `NewEntryScreen.tsx`:**

- Add two toggle switches or styled buttons for "Favorite" and "Milestone".
- Update the image/video picker to handle both media types.

**B. `JournalEntryCard.tsx`:**

- **Display Tags**: Add small tag indicators if `isFavorited` or `isMilestone` is true.
- **Display Age**: Add a `Text` component to show the `childAgeAtEntry`.
- **Like Button**: The existing heart icon will be wired to the `toggleLike` function. It will show a filled state if the current user has liked the post and display the total like count.
- **Edit/Delete Menu**: Add a "three-dots" icon that opens a menu with "Edit" and "Delete" options.

**C. `JournalScreen.tsx`:**

- **Filtering UI**: Add a header or a set of filter chips to allow users to filter the timeline by "All", "Favorites", "Milestones", or a specific age range.
- The `useJournal` hook will be updated to accept filter parameters and adjust the Firestore query accordingly.

**D. `EditEntryScreen.tsx` (New Screen):**

- A new screen that reuses the layout of `NewEntryScreen` but is pre-populated with the data from an existing entry. The save button will call the `updateEntry` function.
