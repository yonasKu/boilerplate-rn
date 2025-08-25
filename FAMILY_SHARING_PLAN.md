# Family Sharing (View-Only Accounts) – Implementation Plan

## Summary
Enable parents to invite friends/family as free, view-only accounts. Viewers can view recaps and journal, react, and comment, but cannot edit or journal. Viewers can upgrade.

## Data Model (Collections)
- invitations
  - inviterId, inviteeContact (email|phone), role: 'viewer', status: 'pending|accepted|revoked'
  - inviteCode, expiresAt, createdAt, updatedAt
- sharedAccess
  - ownerId, viewerId, scopes: string[] (e.g., ['recaps:read','journal:read','comments:write','likes:write'])
  - createdAt, updatedAt

## Firestore Rules (High-Level)
- invitations
  - create/read/update by inviter (owner)
  - accept by invitee with valid code
- sharedAccess
  - owner can create/update/revoke
  - viewer can read their own access records
- content access (recaps/journal)
  - allow read to owner OR viewers where sharedAccess exists
  - allow write likes/comments for viewers if scope includes 'comments:write'/'likes:write'

## Indexes
- invitations: [inviterId, status], [inviteCode]
- sharedAccess: [ownerId, viewerId]

## Services API (TypeScript)
- src/features/family/services/familyService.ts
  - createInvitation(inviteeContact): Promise<inviteCode>
  - acceptInvitation(inviteCode): Promise<void>
  - getFamilyMembers(ownerId): Promise<{ viewers: User[]; ownersViewingMe: User[] }>
  - updatePermissions(viewerId, scopes): Promise<void>
  - revokeAccess(viewerId): Promise<void>

## UI Entry Points
- Settings → Family Sharing
  - List viewers, invite, manage scopes, revoke
- Onboarding upgrade path for viewers → upgrade to full account

## Notifications
- Send to owner when invite accepted
- Send to viewers when new recaps available

## TODOs
- [ ] Define and add rules for shared reads on recaps/journal
- [ ] Implement invitations + sharedAccess services
- [ ] Build Family Sharing settings screens
- [ ] Add composite indexes listed above
- [ ] QA access matrix (owner vs viewer) in emulator
