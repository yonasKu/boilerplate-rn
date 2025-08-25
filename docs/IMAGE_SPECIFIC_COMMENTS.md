# Image-specific Comments for AI Recaps

This spec adds the ability for users to leave comments that target a specific image within an AI Recap. It preserves backward compatibility with existing recap-level comments.

## Goals

- Allow commenting on a specific image inside a recap (both from full-screen image viewer and recap screen).
- Show a small image thumbnail next to image-specific comments in the list.
- Keep generic recap-level comments working unchanged.
- Minimal changes to existing screens/services; additive and backward compatible.

## Data Model

Collection: `recapComments`

New/updated Firestore document shape:

```ts
// Existing fields kept; new fields are optional and only present for image-specific comments
export interface RecapComment {
  id?: string;
  recapId: string;                 // recap doc id
  userId: string;
  userName: string;
  userAvatar?: string | null;
  text: string;
  createdAt: Date;                 // serverTimestamp at write
  updatedAt: Date;                 // serverTimestamp at write

  // NEW: image context (optional)
  imageUrl?: string;               // the image being commented on (canonical URL)
  imageThumbUrl?: string;          // small/optimized thumbnail if available (optional)
  imageIndex?: number;             // index in recap.media.highlightPhotos (for stable ordering)
  imageStoragePath?: string;       // storage path if URL is ephemeral (optional)
}
```

Notes:
- At least one of `imageUrl` or `imageIndex` should be present for image-specific comments. If neither is present, treat as recap-level comment.
- `imageIndex` is resilient to URL changes if the order is stable; `imageUrl` is resilient to reordering. We can store both when known.

## Firestore Structure

- Keep collection as a flat `recapComments` for now (no subcollections), to avoid migration complexity.
- Documents include `recapId` and optional image context.

## Service API Changes

File: `src/features/recaps/services/recapCommentsService.ts`

- Update types and method signatures to support the optional image context.

```ts
// 1) Extend interface (backward compatible)
export interface RecapComment { /* as above */ }

// 2) addComment: add optional image context
addComment(
  recapId: string,
  userId: string,
  userName: string,
  text: string,
  userAvatar?: string,
  options?: { imageUrl?: string; imageThumbUrl?: string; imageIndex?: number; imageStoragePath?: string }
): Promise<RecapComment>

// 3) getComments: support both recap-level and image-level queries
getComments(
  recapId: string,
  filter?: { imageIndex?: number; imageUrl?: string; onlyRecapLevel?: boolean }
): Promise<RecapComment[]>
```

File: `src/services/aiRecapService.ts`

- No schema change required, but expose helper(s) if useful:
  - `getImageContext(recap: Recap, imageIndex: number): { imageUrl: string; imageThumbUrl?: string; imageIndex: number }`
  - Not required for MVP; can be added later for convenience.

## UI/UX Changes

Files: `src/features/recaps/screens/RecapViewScreen.tsx`, `src/features/recaps/components/FullScreenImageFooter.tsx`, `src/features/recaps/components/comments/*`

- From the full-screen viewer footer (`FullScreenImageFooter`), when user taps comment, pass the current image context to the comments modal so `CommentInput` posts with image info.
- `CommentsSection`:
  - Fetch comments with `getComments(recapId)` (all), display image thumbnail at the right for comments that include `imageUrl` or can be resolved via `imageIndex`.
  - Consider a small 36–44px rounded thumbnail aligned with the comment row, as per mock.
  - For recap-level comments, render as today (no thumbnail).
- `CommentInput`:
  - Accept an optional `imageContext` prop `{ imageUrl?: string; imageThumbUrl?: string; imageIndex?: number; imageStoragePath?: string }`.
  - When present, pass it to `addComment` options.
- Full-screen modal open from a given image should open with that `imageContext` so the first comment input is image-specific by default.

## Querying

- Default list (in recap details): `getComments(recapId)` ordered by `createdAt desc`.
- Optional filter for current image: `getComments(recapId, { imageIndex })` when showing comments for a single image.
- To show the badge count over the image in the grid (future enhancement), use `where('recapId', '==', recapId)` + `where('imageIndex', '==', i)`.

## Security Rules

Update Firestore rules to allow the new optional fields and validate ownership:

- Allow create if: `request.auth != null` AND user has read access to `recaps/{recapId}` (same rules as existing comments) AND fields types are valid.
- Optional fields validation (all optional): `imageUrl` string, `imageThumbUrl` string, `imageIndex` number, `imageStoragePath` string.
- Keep rate-limiting in client or Cloud Function if needed later.

Pseudocode snippet:
```js
match /recapComments/{commentId} {
  allow read: if canReadRecap(resource.data.recapId);
  allow create: if request.auth != null && canReadRecap(request.resource.data.recapId)
    && request.resource.data.text is string
    && (!('imageUrl' in request.resource.data) || request.resource.data.imageUrl is string)
    && (!('imageThumbUrl' in request.resource.data) || request.resource.data.imageThumbUrl is string)
    && (!('imageIndex' in request.resource.data) || request.resource.data.imageIndex is int)
    && (!('imageStoragePath' in request.resource.data) || request.resource.data.imageStoragePath is string);
}
```

`canReadRecap(recapId)` should reuse existing recap access logic.

## Indexes

Add composite indexes for query performance (Firebase will prompt, but predefine here):

- `recapComments`: `recapId ASC, createdAt DESC`
- `recapComments`: `recapId ASC, imageIndex ASC, createdAt DESC` (for per-image views)

## Migration Plan

- No migration required. Existing documents remain valid and are treated as recap-level comments (no image fields).
- New code must tolerate missing image fields.

## Edge Cases

- Image removed from recap: keep the comment, render with a placeholder thumbnail; still show `text` and user info.
- Image order changed: prefer to store both `imageIndex` and `imageUrl` when possible; resolve thumbnail by `imageUrl` first, fallback to `imageIndex`.
- Missing/expired `imageUrl` (signed URL): attempt to derive via `imageStoragePath` (future), else show placeholder.

## Analytics (optional)

- Event: `recap_image_comment_created` with properties `{ recapId, imageIndex, hasThumb }`.

## Open Questions

- Do we want a toggle to filter comments by “All” vs “This Image” in the modal?
- Should we dedupe `imageThumbUrl` generation or lazy-generate via Cloud Functions?

## Timeline

- Backend/service changes: ~0.5 day
- UI changes: ~0.5–1 day
- QA across Android/iOS (focus iPhone safe area): ~0.25 day
