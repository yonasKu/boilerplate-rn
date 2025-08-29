# Family Sharing: Shared Access API Enhancement Plan

Goal: Return viewer profile info alongside shared access records so the client can render FamilySharingBubbles without per-viewer Firestore lookups.

## Current
- Cloud Function: `familyGetSharedAccess` returns `SharedAccess[]`:
  - Fields: `ownerId`, `viewerId`, `childId?`, `createdAt`, `status` (active/pending/removed)
- Client fetches user briefs separately via `users/{uid}` for each `viewerId`.
- Drawbacks:
  - Extra round trips and waterfall latency on slow networks
  - UI jank while loading avatars

## Proposed Response Shape
Augment the function to include viewer/user brief data and (optionally) owner brief.

```ts
export interface UserBrief {
  uid: string;
  name: string;          // fallback to email local-part
  profileImageUrl?: string;
}

export interface SharedAccessWithProfiles {
  ownerId: string;
  viewerId: string;
  childId?: string;
  createdAt: number;     // ms epoch
  status: 'active' | 'pending' | 'removed';
  viewer?: UserBrief;    // populated when permitted
  owner?: UserBrief;     // optional, useful for admin dashboards
}
```

Notes:
- Keep existing fields intact for backward compatibility.
- Add `viewer` (and optionally `owner`) objects when readable by the caller per security rules.

## Backend Changes
1. Extend `familyGetSharedAccess`
   - After computing the list of `SharedAccess` records for the requesting user, collect unique `viewerId`s.
   - Batch fetch corresponding `users/{uid}` docs using `getAll` or batched `get` (max 10 per batch; chunk if needed).
   - Map to `UserBrief` with safe fallbacks:
     - `name = data.name || emailLocalPart || 'User'`
     - `profileImageUrl = data.profileImageUrl || ''`
   - Join briefs into the results as `viewer`.

2. Optional: Owner brief
   - If the client needs it (e.g., multi-owner contexts), include `owner` brief using a single fetch for `ownerId`.

3. Pagination (future-proofing)
   - If the dataset can grow large, accept `pageSize`, `pageToken` and return `nextPageToken`.
   - For now, most families have small N; pagination is optional.

4. Security & Rules
   - Ensure the calling user can only read shared access where `ownerId === caller.uid` or `viewerId === caller.uid`.
   - When adding `viewer`/`owner` briefs, do not leak private fields.
   - Rule of thumb: only surface `name` and `profileImageUrl` from `users/{uid}`.

5. Performance
   - Use batched reads; avoid per-user sequential fetches.
   - Consider minimal caching (e.g., in-memory for function cold-start window) keyed by uid; TTL ~60s.
   - Add indexes only if Firestore query planner asks for them (ownerId/status).

## Client Impacts
- `FamilyService.getSharedAccess()` can return `SharedAccessWithProfiles[]`.
- `FamilySharingBubbles` uses `item.viewer` directly; fallback to client-side fetch only if `viewer` missing.
- Migration plan:
  1. Add new function param `includeProfiles = true` (default true). Keep `false` to preserve legacy behavior.
  2. Gradually roll out client expecting `viewer` presence; maintain fallback for a release.

## Error Handling
- If a `users/{uid}` doc is missing:
  - Return `viewer` with `{ uid, name: 'User', profileImageUrl: '' }`.
  - Log a warning; do not fail the entire call.

## Testing
- Unit tests for join logic (0, 1, many viewers; missing user doc).
- Integration test: create N shared access docs, verify function returns joined briefs in one call.
- Load test: 50 viewers, ensure < 500ms p95 in warm invocations.

## Deployment
- Version function as `familyGetSharedAccessV2` or add `includeProfiles` flag.
- Update client service at `src/services/familyService.ts` to parse `viewer`.
- Roll out behind a remote-config flag if desired.

## Related Considerations
- Ensure user docs are created on signup/login (see `docs/BACKEND_PROFILE_REQUIREMENTS.md`).
- If supporting cross-tenant reads in future, restrict joins by explicit allowlist.

## Summary
Add a server-side join in `familyGetSharedAccess` to return `viewer` briefs. This removes client waterfalls, stabilizes avatar rendering, and keeps payloads minimal and safe. Backward-compatible via a versioned endpoint or a feature flag parameter.
