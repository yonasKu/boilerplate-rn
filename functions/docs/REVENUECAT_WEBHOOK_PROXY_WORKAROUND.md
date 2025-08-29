# RevenueCat Webhook: Public Proxy Workaround (when org policy blocks `allUsers`)

This document explains:
- The exact issue you hit (why adding `allUsers` failed)
- A safe workaround that keeps your Cloud Run service private while exposing a public endpoint via a small proxy
- Two implementation options (recommended: Google API Gateway)

---

## What the issue is (clearly)
- Your organization enforces the policy: `constraints/iam.allowedPolicyMemberDomains` ("Domain Restricted Sharing").
- This blocks adding the `allUsers` principal to IAM policies. Cloud Run uses `allUsers` with role `roles/run.invoker` to make a service public.
- Result: You cannot make `revenuecatwebhook` public directly. External callers like RevenueCat are rejected at the Google IAM layer before your code runs, so your in-code Bearer secret is never reached.

Impact on your function:
- File: `functions/revenuecatWebhook.js`
- It correctly validates `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>`.
- But without public access, the request is blocked by IAM and never gets to your handler.

---

## Workaround idea
Expose a separate public endpoint (a proxy you control). The proxy receives the request from RevenueCat and then calls your private Cloud Run service using Google identity (a service account). This avoids `allUsers` while allowing external traffic.

High-level flow:

RevenueCat → [Public Proxy] → (Google ID token via service account) → Private Cloud Run: `revenuecatwebhook`

Your function still checks the same Bearer secret, so there are two layers of protection:
- Google IAM at Cloud Run (service account identity)
- Your app-level Bearer secret in the function

---

## Option A (recommended): Google API Gateway in front of Cloud Run
API Gateway gives you a public HTTPS endpoint. It authenticates to your private Cloud Run using a service account and an ID token. No `allUsers` binding is required on Cloud Run.

Prerequisites (Project: `sproutbook-d0c8f`):
- Enable APIs: `apigateway.googleapis.com`, `servicemanagement.googleapis.com`, `servicecontrol.googleapis.com`, `run.googleapis.com`.
- Create a service account, e.g. `api-gateway-invoker@sproutbook-d0c8f.iam.gserviceaccount.com`.
- Grant it permission to invoke your Cloud Run service:
  - Cloud Run → `revenuecatwebhook` → Permissions → Add principal: `api-gateway-invoker@...` → Role: `Cloud Run Invoker` (`roles/run.invoker`) → Save.

Steps (high level):
1) Prepare an OpenAPI (OAS) spec for API Gateway:
   - Define a single POST route, e.g. `/revenuecat-webhook`.
   - Configure the backend to point to your Cloud Run URL (from deploy output).
   - Configure the gateway to obtain and send a Google ID token to the backend using the service account created above (backend auth).
   - Set the token's audience (target) to the Cloud Run URL.

2) Create the API, upload the config, and create a Gateway in `us-central1`.

3) The gateway provides a public URL. Give that URL to RevenueCat as the webhook endpoint.

Notes:
- API Gateway supports backend authentication to Cloud Run with ID tokens minted from a service account you specify. This is the key to avoiding `allUsers` on Cloud Run.
- Keep your Bearer secret validation in `revenuecatWebhook.js` unchanged. The gateway does not bypass your app-level auth.

---

## Option B: External lightweight proxy (e.g., Cloudflare Worker, small VM)
If you prefer not to use API Gateway, you can host a tiny proxy anywhere. The proxy must:
- Be publicly accessible (for RevenueCat)
- Hold credentials for a Google service account (JSON key) that has `roles/run.invoker` on `revenuecatwebhook`
- For each incoming request, mint a Google ID token (audience = your Cloud Run URL) using that service account and forward the request to Cloud Run with header `Authorization: Bearer <ID_TOKEN>`
- Also forward the original `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>` header or inject it server-side before calling Cloud Run

Implementation sketch (conceptual):
- Read the service account key from a secure secret store (never commit it).
- Construct a JWT and exchange it for an ID token targeted at the Cloud Run URL, then call the Cloud Run service with that token.
- Ensure timeouts and retries are sensible; return Cloud Run's response to RevenueCat.

Security notes:
- Treat the service account key like a password. Rotate it periodically.
- Restrict the service account to only `roles/run.invoker` on the single service.

---

## Which option to choose?
- Prefer Option A (API Gateway) if you want a managed, Google-native solution without maintaining code/servers for the proxy.
- Choose Option B if you already have a public edge (e.g., Cloudflare) and want to keep using it.

---

## Verification checklist (for either option)
- Cloud Run `revenuecatwebhook` remains private (no `allUsers` binding)
- A public endpoint exists (Gateway URL or your proxy URL)
- The public endpoint successfully invokes the private Cloud Run and you see logs for your function
- App-level check still enforced:
  - Without `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>` → 401 from your code
  - With correct header → 200

---

## FAQ
- Does this expose my secret?
  - No. Your secret stays in Secret Manager and is only read by the function. The proxy/Gateway just ensures the request reaches your private Cloud Run using Google identity.

- Why not make another Cloud Run that is public?
  - If your org policy blocks `allUsers` anywhere, that new service will be blocked too. The proxy approaches above avoid `allUsers` on Cloud Run.

- Can we keep `invoker: 'public'` in code?
  - Yes. It will be ignored if org policy blocks `allUsers`. Keeping it makes future deploys public automatically if/when the policy exception is granted.
