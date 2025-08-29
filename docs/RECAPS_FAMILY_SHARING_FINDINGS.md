# Family Sharing Recaps – Current Findings

- __User context__: Viewer account has no children on its own user doc. Example:
  - `users/{viewerUid}` shows `children: []`, `subscription: { plan: free, status: trial }`

- __Permission errors__: Reading `users/{ownerUid}` for viewers fails with `Missing or insufficient permissions.`
  - Impact: UI cannot read owner profile or children list.
  - Mitigation options:
    - Allow minimal read to viewers on `users/{ownerUid}` for fields needed by UI (name, profileImageUrl, children[]), or
    - Avoid reading owner profile; load recaps directly by `ownerUid` and skip child UI.

- __Composite index required for child-filtered recaps__: The query
  - `where('userId','==', ownerUid)` + `where('childId','==', childId)` + `orderBy('period.endDate','desc')`
  - needs a Firestore composite index. Create via the link provided in error or manually add:
    - Collection: `recaps`
    - Fields: `userId (ASC)`, `childId (ASC)`, `period.endDate (DESC)`
  - Error link example: https://console.firebase.google.com/v1/r/project/sproutbook-d0c8f/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9zcHJvdXRib29rLWQwYzhmL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9yZWNhcHMvaW5kZXhlcy9fEAEaCwoHY2hpbGRJZBABGgoKBnVzZXJJZBABGhIKDnBlcmlvZC5lbmREYXRlEAIaDAoIX19uYW1lX18QAg

- __Active timeline owner__: For viewers to see inviter’s recaps, the client must query by the __owner’s uid__ (inviter), not the viewer’s uid.
  - Ensure the app has a reliable `activeOwnerId` derived from accepted `sharedAccess`.
  - If `accountType === 'view-only'`, default `activeOwnerId` should be the inviter’s uid.

- __Minimum to display recaps__:
  - Even if owner profile read is denied, recaps should be visible if rules allow reads via `sharedAccess`.
  - Client should:
    - Use `activeOwnerId` when fetching recaps
    - Omit `childId` until an owner child is known (or skip child filter entirely)

- __Rules alignment__: Firestore rules must allow a viewer who has accepted an invite to read `recaps` where `resource.data.userId == ownerUid`.
  - Confirm the `sharedAccess` document exists and matches the rule checks.

## Recommended Next Steps

1. __Create the composite index__ for `recaps` on `(userId ASC, childId ASC, period.endDate DESC)`.
2. __Decide on owner profile access__:
   - Option A: Permit minimal read of owner profile fields to viewers; then show owner name and children in UI.
   - Option B: Keep owner profile private; skip reading it and fetch recaps by `ownerUid` only.
3. __Ensure active owner resolution__:
   - After invite acceptance/verification, the app should resolve `activeOwnerId = inviterUid` for viewers.
4. __Verify `sharedAccess` doc__ exists and matches your rules (viewer→owner mapping).
5. __QA checks__:
   - As viewer: confirm recaps appear for inviter.
   - If child filtering is used: confirm it loads after index creation and owner’s `children[]` is available, or skip child-based queries until then.

## Permanent Fix (backend + data model)

- __Write deterministic IDs__ when creating shared access:
  - Path: `sharedAccess/${ownerId}_${viewerId}`
  - Fields: `{ ownerId, viewerId, scopes: string[], createdAt, updatedAt }`
  - Creation should remain backend-only per rules.
- __Optional rules tweak__ if you want viewers to see owner minimal profile:
  - In `match /users/{userId}` add a read condition allowing `hasSharedAccessToOwner(userId)` for a minimal projection (e.g., `name`, `profileImageUrl`, `children`). Otherwise keep the current private profile behavior and rely on recap visibility only.

## Verification Checklist

- __Access doc__: `sharedAccess/${ownerId}_${viewerId}` exists with correct fields.
- __Recaps reads__: Viewer can read `recaps` for `userId == ownerId`.
- __Index__: Composite index exists for `(userId ASC, childId ASC, period.endDate DESC)` if child filtering is used.
- __Client queries__:
  - `useRecaps(ownerId, childId?)` uses `activeOwnerId`.
  - Skip `childId` filter until children are known and index is present.
  - Owner profile read failures do not block recap list.

## Notes
- The current errors are expected given:
  - Strict rules on `users/{ownerUid}`
  - Missing composite index for the child-filtered recap query
- Fixes can be staged: first show owner’s recaps without child filter, then enable child filtering after index and/or permissions are set.
