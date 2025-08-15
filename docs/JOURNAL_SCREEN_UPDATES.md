# Journal Screen Updates

This document outlines the required updates for the Journal Screen and related components.

## 1. Location Tagging

- **Goal**: Allow users to tag a location to each journal entry, similar to an Instagram post.
- **Requirement**: The location data will be used to display the entry's location on the main timeline view.
- **Implementation Details**:
  - Add a "Location" field to the journal entry creation/edit form.
  - Integrate with a location service (e.g., Google Places API) to allow users to search for and select a location.
  - Store the selected location data (name, address, coordinates) in the Firestore document for the journal entry.
  - Update the `JournalEntry` type in `src/types/journal.ts` to include the new location field.

## 2. Screen Transition Animation

- **Goal**: Change the navigation animation for the journal entry screen.
- **Requirement**: The page should slide up from the bottom when a user opens a journal entry, instead of sliding in from the right.
- **Implementation Details**:
  - In the navigation setup (likely in `src/app/(main)/(tabs)/_layout.tsx` or a similar navigator file), modify the screen options for the journal entry screen.
  - Use the `presentation: 'modal'` or a custom transition to achieve the slide-from-bottom effect.
