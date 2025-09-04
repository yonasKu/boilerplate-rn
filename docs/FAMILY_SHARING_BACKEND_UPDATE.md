# Family Sharing Backend Update

This document describes the backend enhancements for Family Sharing and provides a checklist of what was implemented and what to verify.

## Summary

- Added support for capturing invitee name when creating invitations.
- On invitation acceptance, we now:
  - Mark invitation as accepted with timestamps.
  - Persist `inviteeUserId` and an `acceptedProfile` snapshot.
  - Upsert `sharedAccess/{ownerId}_{viewerId}` and denormalize `owner`/`viewer` profile snapshots.
- `familyGetSharedAccess` and `familyGetInvitations` now include these enriched fields in responses and fall back to `users/{uid}` when denormalized profiles are missing.

## Files Touched

- `functions/functions/http/family.js`

## Endpoints and Behaviors

- `POST familyCreateInvitation`
  - Request: `{ inviteeContact: string, inviteeName?: string, scopes?: string[] }`
  - Response: `{ invitationId, inviteCode, expiresAt, scopes, inviteeName }`
  - Writes `invitations/{id}` with: `inviterId, inviteeContact, inviteeName, role, status=pending, inviteCode, expiresAt, scopes, createdAt, updatedAt`.

- `POST familyAcceptInvitation`
  - Request: `{ inviteCode: string }`
  - Validates pending invite and expiry.
  - Upserts `sharedAccess/{ownerId}_{viewerId}` with: `{ ownerId, viewerId, scopes, createdAt, updatedAt, owner: {uid,name,profileImageUrl}, viewer: {uid,name,profileImageUrl} }`.
  - Updates invitation with: `{ status='accepted', updatedAt, acceptedAt, inviteeUserId, acceptedProfile }`.
  - Ensures viewer `users/{viewerId}` exists and sets `accountType='view-only'`, `parentUserId=ownerId`.

- `POST familyGetSharedAccess`
  - Request: `{ includeProfiles?: boolean = true, includeOwner?: boolean = false }`
  - Returns list of shared access both as owner and viewer.
  - If profiles are already denormalized on the doc, they are returned directly.
  - Otherwise, falls back to `users/{uid}` to construct `{ uid, name, profileImageUrl }`.

- `POST familyGetInvitations`
  - Returns inviter's invitations with: `inviteeContact, inviteeName, status, inviteCode, scopes, timestamps, inviteeUserId, acceptedAt, acceptedProfile`.

## Profile Change Propagation

- Trigger: `functions/functions/onUserProfile.js` exported as `onUserProfileUpdated` in `functions/index.js`.
- When a `users/{uid}` document is created/updated, it propagates the latest brief profile:
  - Updates `sharedAccess` documents where the user is `viewerId` → sets `viewer` brief.
  - Updates `sharedAccess` documents where the user is `ownerId` → sets `owner` brief.
  - Updates `invitations` documents where `inviteeUserId == uid` → sets `acceptedProfile`.
- Effect: Inviter and family members will see the updated name/photo without manual refresh of denormalized data.

## Data Model Additions

- Collection: `invitations/{id}`
  - New fields: `inviteeName` (on create), `inviteeUserId`, `acceptedAt`, `acceptedProfile` (on accept)

- Collection: `sharedAccess/{ownerId}_{viewerId}`
  - New fields: `viewer`, `owner` (denormalized profile briefs)

Profile brief shape:
```
{ uid: string, name: string, profileImageUrl: string }
```

## Checklist (Done)

- [x] Capture and store `inviteeName` in `familyCreateInvitation`
- [x] On accept, update invitation with `inviteeUserId`, `acceptedAt`, `acceptedProfile`
- [x] Denormalize `viewer` and `owner` profiles into `sharedAccess`
- [x] Extend `familyGetSharedAccess` to include denormalized profiles and fallback to `users/{uid}`
- [x] Extend `familyGetInvitations` to include `inviteeName`, `inviteeUserId`, `acceptedAt`, `acceptedProfile`

## Checklist (To Verify / Test)

- [ ] Create an invite with a typed name; verify `inviteeName` persists in `invitations`
- [ ] Accept the invite; verify:
  - [ ] `invitations/{id}` has `status='accepted'`, `acceptedAt`, `inviteeUserId`, `acceptedProfile`
  - [ ] `sharedAccess/{ownerId}_{viewerId}` exists with `owner`, `viewer`, and correct `scopes`
- [ ] Call `familyGetSharedAccess` with `includeProfiles=true`; verify `viewer` (and `owner` if requested) present
- [ ] Call `familyGetInvitations`; verify invite shows enriched fields
- [ ] UI: Family list shows accepted viewer names using `viewer.name` from `sharedAccess`
- [ ] Update a user's profile (name/photo) and verify:
  - [ ] `sharedAccess` docs update their `viewer`/`owner` brief accordingly
  - [ ] `invitations` docs (for accepted invites) update `acceptedProfile`

## Notes

- Admin SDK is used; Firestore security rules do not block these writes.
- Frontend should include `inviteeName` when calling `familyCreateInvitation` and prefer `acceptedProfile.name` or `viewer.name` for display.
