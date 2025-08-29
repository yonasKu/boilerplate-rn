# Make `revenuecatWebhook` Public (Cloud Run Invoker)

This guide explains the exact IAM roles to grant and the steps to make the Cloud Run service for `revenuecatWebhook` publicly invokable so RevenueCat can call it. The function still validates an app-level Bearer secret in code.

- Function file: `functions/revenuecatWebhook.js`
- Region: `us-central1`
- Service name (Cloud Run): `revenuecatwebhook`
- App-level secret: `REVENUECAT_WEBHOOK_SECRET` (in Secret Manager)

---

## Why it must be public
RevenueCat is an external service and cannot authenticate with Google IAM. The function must allow unauthenticated (public) invocation at the Cloud Run layer. Your code still checks:

- `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`

So it is safe to make the service public.

---

## Required IAM for the person performing the change
Grant one of the following at the PROJECT level (`sproutbook-d0c8f`) to the deployer/admin who will make the service public:

- Option A (single role):
  - `roles/functions.admin`

- Option B (combination):
  - `roles/run.admin`
  - `roles/iam.securityAdmin`

Either option allows setting the Cloud Run IAM policy to add `allUsers` as `roles/run.invoker`.

> Temporary fallback: `roles/owner` also works, but is not recommended long-term.

---

## Make the service public

### Cloud Console (UI)
1. Go to Cloud Run: https://console.cloud.google.com/run?project=sproutbook-d0c8f
2. Open service `revenuecatwebhook` (region `us-central1`).
3. Permissions tab → Grant Access.
4. New principals: `allUsers`
5. Role: `Cloud Run Invoker` (`roles/run.invoker`)
6. Save.

### gcloud (CLI)
```bash
gcloud run services add-iam-policy-binding revenuecatwebhook \
  --region us-central1 \
  --member=allUsers \
  --role=roles/run.invoker \
  --project sproutbook-d0c8f
```

If using Firebase CLI with `invoker: 'public'` in `onRequest()` options, a deploy will attempt to apply the same change automatically; the above roles are still required.

---

## Possible organization policy blockers and how to resolve

If the above steps fail with a policy error, your organization likely enforces one or more constraints. Ask an Org Admin to add a project-scoped exception for `sproutbook-d0c8f`.

- Constraint: Domain Restricted Sharing
  - ID: `constraints/iam.allowedPolicyMemberDomains`
  - Symptom: Blocking use of `allUsers` principal.
  - Fix: Add a rule targeting the project with Enforcement Off or allowlist an empty set so `allUsers` is permitted for this project.
  - Console: IAM & Admin → Organization Policies → search "Domain Restricted Sharing" → Edit → Add Rule → Target: `sproutbook-d0c8f` → turn Enforcement Off → Save.

- Constraint: Cloud Run ingress restrictions
  - ID: `constraints/run.allowedIngress`
  - Symptom: Only internal or internal-and-cloud-load-balancing allowed.
  - Fix: Add a project-level exception to allow public ingress (include `INGRESS_TRAFFIC_ALL`) or turn enforcement Off for this project.
  - Console: IAM & Admin → Organization Policies → search "Cloud Run Ingress" → Edit → Add Rule → Target: `sproutbook-d0c8f` → allow public ingress → Save.

> Your repository also contains `docs/DISABLE_ORG_POLICY.md` as a reference for creating project-scoped exceptions.

---

## Verification

After making the service public, verify both layers:

1) Cloud Run IAM
```bash
gcloud run services get-iam-policy revenuecatwebhook \
  --region us-central1 \
  --project sproutbook-d0c8f \
  --format=json | jq '.bindings[] | select(.role=="roles/run.invoker")'
```
- Expect to see a binding containing `"members": [ "allUsers" ]`.

2) Application-level secret
```bash
curl -i -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>" \
  https://revenuecatwebhook-ii4yrkk54q-uc.a.run.app \
  -d '{"healthcheck":true}'
```
- Expect HTTP 200 from the function. Without the Authorization header, expect 401 from your code.

---

## Notes
- Keep `invoker: 'public'` in `functions/revenuecatWebhook.js` once IAM/org policy is in place. This allows future deploys to retain public access automatically.
- Secrets:
  - Production: `REVENUECAT_WEBHOOK_SECRET` in Secret Manager (referenced by the function).
  - Local/emulator: optional `LOCAL_REVENUECAT_WEBHOOK_SECRET` in `.env.local`.
- Your other HTTP functions don’t require public unauthenticated access unless they are called by external systems (most are user/app initiated and can remain non-public or use auth).
