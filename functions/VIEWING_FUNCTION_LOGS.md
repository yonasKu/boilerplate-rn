# Viewing Function Logs

Excellent! The functions are deployed. Now you can monitor their logs to confirm they are running correctly and to debug any issues. Here are the commands you'll need.

## 1. View Logs for the Scheduled Test Recap Function

The `generateAllUsersTestRecaps` function runs automatically every 10 minutes. To see its output, use the following command in your terminal. This will show you the most recent logs and continue to stream new logs as they arrive.

```bash
firebase functions:log --only generateAllUsersTestRecaps --project=sproutbook-d0c8f
```

**What to look for in the logs:**
*   `=== Generating Test Recaps for All Users ===` (Indicates the function started)
*   `Found X children for user YYY` (Shows if it's finding children for a user)
*   `Generating daily recap for child ZZZ...` (Confirms it's starting the process for a child)
*   `Recap saved successfully with ID: ...` (The ultimate success message!)
*   Any errors related to Firestore permissions, OpenAI API calls, or missing data.

## 2. View Logs for the Manual HTTP Function

If you ever need to trigger the `generateDailyRecap` function manually (for example, via a client application), you can view its specific logs with this command:

```bash
firebase functions:log --only generateDailyRecap --project=sproutbook-d0c8f
```

# Recommended Next Step

Run the first command to check the logs for `generateAllUsersTestRecaps`. Since it runs every 10 minutes, you should see log entries appearing shortly. If you run the command and see nothing, wait a few minutes for the next scheduled run to occur.
