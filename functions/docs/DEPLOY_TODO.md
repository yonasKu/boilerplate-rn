# Deploy Todo – Private HTTP Functions (no org-policy change)

| Step | Action | File / Command |
|------|--------|----------------|
| 1 | **Update SDK** | `npm i firebase-functions@latest firebase-admin@latest` |
| 2 | **Convert testConnection to v2 private** | `functions/testConnection.js` |
| 3 | **Add Hosting rewrites** | `firebase.json` |
| 4 | **Create public folder** | `public/index.html` |
| 5 | **Deploy slice** | `firebase deploy --only functions:testConnection,hosting` |
| 6 | **Test** | `curl https://<site>.web.app/api/testConnection` |
| 7 | **Repeat for other HTTP endpoints** | `registerDeviceToken`, `removeDeviceToken`, `sendTestNotification` |

## 1. Update SDK
```bash
npm i firebase-functions@latest firebase-admin@latest
```

## 2. Convert testConnection to v2 private
Replace `functions/testConnection.js`:
```javascript
const { onRequest } = require('firebase-functions/v2/https');
const { testConnectionHandler } = require('./testConnectionHandler'); // existing logic

exports.testConnection = onRequest(
  { region: 'us-central1', invoker: 'private' },
  async (req, res) => {
    await testConnectionHandler(req, res);
  }
);
```

## 3. Add Hosting rewrites in firebase.json
```json
{
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "/api/testConnection", "function": { "functionId": "testConnection", "region": "us-central1" } }
    ]
  }
}
```

## 4. Create public folder
```bash
mkdir -p public
echo '<h1>Sproutbook API</h1>' > public/index.html
```

## 5. Deploy
```bash
firebase deploy --only functions:testConnection,hosting --project sproutbook-d0c8f
```

## 6. Test
```bash
curl -i https://<your-site>.web.app/api/testConnection
```

## 7. Repeat
Apply the same pattern to `registerDeviceToken`, `removeDeviceToken`, `sendTestNotification`.

Done – no org-policy change needed.
