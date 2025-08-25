# Family Sharing – Backend Alignment Plan

## Summary
Define Firestore data, security rules, Cloud Functions, and indexes to support the Family Sharing feature aligned with the frontend plan.

## Firestore Collections
- `invitations`
  - inviterId, inviteeContact(email|phone), role: 'viewer'
  - status: 'pending' | 'accepted' | 'revoked'
  - inviteCode, expiresAt (Timestamp), createdAt, updatedAt
- `sharedAccess`
  - ownerId, viewerId, scopes: string[] (e.g., ['recaps:read','journal:read','comments:write','likes:write'])
  - createdAt, updatedAt

## Composite Indexes
- `invitations`:
  - [inviterId, status]
  - [inviteCode]
- `sharedAccess`:
  - [ownerId, viewerId]

## Security Rules (Outline)
- `invitations`:
  - create/read/update by inviter (ownerId == request.auth.uid)
  - accept allowed when `status == 'pending'` and `inviteCode` matches input; write `viewerId = request.auth.uid` and set `status = 'accepted'`
- `sharedAccess`:
  - owner can create/update/revoke where `ownerId == request.auth.uid`
  - viewer can read where `viewerId == request.auth.uid`
- Content read rules (recaps/journal):
  - allow read if `ownerId == request.auth.uid` OR there exists `sharedAccess` where `ownerId == resource.data.ownerId` and `viewerId == request.auth.uid`
- Content write rules for interactions:
  - allow likes/comments if there exists `sharedAccess` with `comments:write`/`likes:write` scope

## Cloud Functions (Node.js)
- `createInvitation(data)`: 
  - Validate inviter is authed, normalize contact, generate `inviteCode`, set `status='pending'`, `expiresAt`, create doc in `invitations`.
  - Optionally send email/SMS (via provider) with link containing `inviteCode`.
- `acceptInvitation({ inviteCode })`:
  - Validate code exists, not expired, `status='pending'`.
  - Ensure `viewerId = context.auth.uid` not equal to inviterId.
  - Create/merge `sharedAccess` doc with default scopes `['recaps:read']`.
  - Update invite `status='accepted'`, set `updatedAt`.
  - Notify inviter (FCM) that invite accepted.
- `updatePermissions({ viewerId, scopes })`:
  - Auth must be owner; update `sharedAccess.scopes`.
- `revokeAccess({ viewerId })`:
  - Auth must be owner; delete or mark `sharedAccess` revoked.

## HTTP Callable/HTTPS Endpoints
- Callable (Firebase Functions) or HTTPS with auth middleware:
  - `family-createInvitation`
  - `family-acceptInvitation`
  - `family-updatePermissions`
  - `family-revokeAccess`

## Firestore Triggers (Optional)
- onWrite `sharedAccess` → send notification to viewer when new content (recaps) is available (fan-out)
- onCreate `invitations` → audit log

## Data Shapes (TypeScript)
```ts
export type FamilyInvitation = {
  inviterId: string;
  inviteeContact: string; // email or phone
  role: 'viewer';
  status: 'pending' | 'accepted' | 'revoked';
  inviteCode: string;
  expiresAt: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};

export type SharedAccess = {
  ownerId: string;
  viewerId: string;
  scopes: string[]; // e.g., ['recaps:read','journal:read','comments:write','likes:write']
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};
```

## Backend Workflow
1. Owner calls `createInvitation` → returns `inviteCode` → frontend shares the code.
2. Viewer signs in → enters `inviteCode` → calls `acceptInvitation`.
3. Function validates and creates `sharedAccess` with default scopes.
4. Owner can later call `updatePermissions` or `revokeAccess`.

## Alignment with Frontend Service
- Endpoints support the services in `src/features/family/services/familyService.ts`:
  - `createInvitation(inviteeContact)` → returns `inviteCode`
  - `acceptInvitation(inviteCode)` → void
  - `getFamilyMembers(ownerId)` → query `sharedAccess` + join `users`
  - `updatePermissions(viewerId, scopes)` → void
  - `revokeAccess(viewerId)` → void

## Migration Steps
- Create collections and indexes
- Implement callable functions + add to `functions/index.js`
- Update Firestore rules for shared reads and interactions
- Implement `familyService.ts` on frontend to call functions and read Firestore
- QA with emulator: matrix of owner vs viewer access

## QA Checklist
- Invitation lifecycle: pending → accepted → revoked
- Shared read works for recaps/journal
- Comment/like allowed only with scopes
- Security rules prevent unauthorized access
- Notifications dispatched on acceptance
