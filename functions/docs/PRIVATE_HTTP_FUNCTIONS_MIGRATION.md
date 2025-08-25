# Private HTTP Functions via Firebase Hosting (Cloud Functions 2nd gen)

This guide converts your HTTP endpoints to Cloud Functions 2nd gen with a private invoker and exposes them via Firebase Hosting rewrites. It avoids `allUsers` IAM grants blocked by org policies.

---

## Why this approach
- Org policy forbids public IAM members like `allUsers`, causing deploy failures when functions are made public.
- In 2nd gen, you can set `invoker: "private"` on HTTP functions and have Firebase Hosting call them internally via rewrites.
- Clients hit Hosting URLs (e.g., `https://<site>.web.app/api/...`), not the `cloudfunctions.net` domain.

## What you will change
- Migrate HTTP functions to Functions v2 (`firebase-functions/v2/https`) and set `invoker: "private"`.
- Add Hosting rewrites in `firebase.json` to route `/api/...` paths to these functions.
- Update the client/app to call the Hosting routes.

---

## Prerequisites
- Firebase CLI recent version (`firebase --version`).
- Node 20 runtime (your project already uses this).
- Project/region: `sproutbook-d0c8f` / `us-central1`.

---

## Step 1 — Update dependencies (if needed)
From your functions source directory (in this repo it looks like the root), ensure latest Admin and Functions SDK:

```bash
npm i firebase-admin@latest firebase-functions@latest
```

---

## Step 2 — Convert HTTP functions to v2 with private invoker
For each HTTP endpoint (e.g., `registerDeviceToken`, `removeDeviceToken`, `sendTestNotification`, `testConnection`), switch to v2 and set `invoker: "private"`.

Example pattern:

```javascript
// index.js (or the file where the HTTP function lives)
import { onRequest } from 'firebase-functions/v2/https';
// import other modules/services as you already do

export const registerDeviceToken = onRequest(
  { region: 'us-central1', invoker: 'private' },
  async (req, res) => {
    // your existing handler body
  }
);
```

Repeat for other HTTP endpoints you want to expose via Hosting.

Notes:
- Keep your existing request handlers; just wrap them with `onRequest` and pass the options above.
- Scheduled/background functions can be migrated to v2 separately using `firebase-functions/v2/scheduler` or keep as-is if that path is working.

---

## Step 3 — Add Firebase Hosting rewrites
In your root `firebase.json`, add rewrites from Hosting paths to your functions. Example:

```json
{
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "/api/registerDeviceToken", "function": { "functionId": "registerDeviceToken", "region": "us-central1" } },
      { "source": "/api/removeDeviceToken",   "function": { "functionId": "removeDeviceToken",   "region": "us-central1" } },
      { "source": "/api/sendTestNotification", "function": { "functionId": "sendTestNotification", "region": "us-central1" } },
      { "source": "/api/testConnection",       "function": { "functionId": "testConnection",       "region": "us-central1" } }
    ]
  }
}
```

Adjust the list to match your actual functions and paths (you can also use globs like `/api/**` mapping to a single router function if your code is structured that way).

---

## Step 4 — Deploy
Deploy only Functions + Hosting:

```bash
firebase deploy --only functions,hosting --project sproutbook-d0c8f
```

- The CLI deploys v2 functions with a private invoker and configures Hosting rewrites.
- After deploy, direct function URLs will return permission errors (expected). Use the Hosting URLs instead.

---

## Step 5 — Update the client/app
Point your app to the Hosting routes, for example:

```
https://<your-site>.web.app/api/registerDeviceToken
https://<your-site>.web.app/api/removeDeviceToken
https://<your-site>.web.app/api/sendTestNotification
https://<your-site>.web.app/api/testConnection
```

If you use a custom domain with Hosting, call that domain instead of `*.web.app`.

---

## Step 6 — Test
- Quick check with curl:

```bash
curl -i https://<your-site>.web.app/api/testConnection
```

- You should get a 200 (or your handler’s status). If you see a 403 from the function, verify the rewrite points to the correct `functionId` and `region` and that the function is 2nd gen with `invoker: "private"`.

---

## Troubleshooting
- If the Hosting route returns 403 or 404:
  - Confirm the function actually deployed in `us-central1` and the name matches the rewrite.
  - Confirm it’s a v2 function (`import { onRequest } from 'firebase-functions/v2/https'`).
  - Re‑deploy `functions,hosting` after any changes.
- If you must grant explicit invocation:
  - Open the function in Google Cloud Console, go to the underlying Cloud Run service > Permissions, and grant “Cloud Run Invoker” to the Firebase Hosting service agent for your project. The Firebase CLI typically manages this when deploying rewrites, but you can add it manually if needed.

---

## Rollback/Direct access (if ever needed)
- If you must call a function directly (not via Hosting), you’ll need to make it public or grant a specific principal as an invoker, which is currently blocked by your org policy. Keep using Hosting routes to stay compliant.

---

## Summary
- Use Functions v2 `onRequest({ invoker: 'private' })` + Hosting rewrites.
- Clients call Hosting paths, not direct function URLs.
- This pattern avoids `allUsers` IAM bindings and complies with restricted org policies.
