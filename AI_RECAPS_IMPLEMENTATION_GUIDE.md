# AI Recaps: Backend Implementation Guide

This guide provides a step-by-step plan for implementing the core backend logic for the automated AI recaps feature. It covers fetching data, calling the AI, and saving the results.

---

### 1. Securely Accessing the OpenAI API Key

For security, the OpenAI API key must not be stored in the code. We will use Firebase Functions environment configuration.

**Action:** The code will access the key using `functions.config().openai.key`.

**Setup (To be run by you once):**
```bash
firebase functions:config:set openai.key="YOUR_SECRET_API_KEY"
```

---

### 2. Implementing the `fetchJournalEntries` Function

This function is responsible for querying the `journalEntries` collection in Firestore to gather the data needed for the recap.

**File:** `functions/services/recapGenerator.js`

**Logic:**
1.  Accept `userId`, `childId`, and a `dateRange` object (`{ start, end }`).
2.  Construct a Firestore query on the `journalEntries` collection.
3.  Filter by `userId` and where `childIds` array contains the `childId`.
4.  Filter by `createdAt` timestamp to be within the `dateRange`.
5.  Order the results by `createdAt` to ensure chronological order.
6.  Return the array of journal entry documents.

---

### 3. Implementing the `callAIProvider` Function

This is the core function where the AI magic happens. It will format the journal entries and send them to OpenAI.

**File:** `functions/services/recapGenerator.js`

**Logic:**
1.  **Initialize OpenAI:** Create an instance of the OpenAI client using the securely stored API key.
2.  **Format the Data:** Convert the array of journal entries into a simplified string format that is easy for the AI to understand. Include the entry text, and note if it was a milestone or favorite.
3.  **Build the Prompt:** Create a dynamic prompt based on the recap type (`weekly`, `monthly`, `yearly`). The prompt will instruct the AI to return a JSON object with specific fields: `title`, `summary`, `keyMoments`, and `highlightPhotoSuggestions`.
4.  **Call the API:** Send the request to the OpenAI Chat Completions endpoint (`gpt-4-turbo-preview` is a good choice) with the system message and the user prompt.
5.  **Parse the Response:** Extract the JSON content from the AI's response. Include error handling in case the response is not valid JSON.
6.  Return the parsed JSON object.

---

### 4. Implementing the `saveRecap` Function

This function takes the AI-generated content and saves it as a new document in the `recaps` collection.

**File:** `functions/services/recapGenerator.js`

**Logic:**
1.  **Structure the Document:** Create a new object that matches the `recaps` collection schema defined in `RECAPS_AI_INTEGRATION_GUIDE.md`.
2.  **Populate Fields:**
    *   `userId`, `childId`, `type`.
    *   `period`: `{ startDate, endDate }`.
    *   `aiGenerated`: The parsed JSON object from the `callAIProvider` function.
    *   `media`: Identify the actual photo URLs from the `highlightPhotoSuggestions` and store them.
    *   `status`: Set to `completed`.
    *   `createdAt`, `generatedAt`: Use `admin.firestore.FieldValue.serverTimestamp()`.
3.  **Save to Firestore:** Use `admin.firestore().collection('recaps').add()` to save the new document.
4.  Return the ID of the newly created recap document.

---

### 5. Next Steps After Implementation

1.  **Install Dependencies:** Run `npm install` inside the `functions` directory.
2.  **Set API Key:** Run the `firebase functions:config:set` command.
3.  **Deploy:** Deploy the functions using `firebase deploy --only functions`.
4.  **Testing:** Manually trigger the functions or wait for the scheduled time to verify that recaps are being generated correctly in Firestore.
