const { admin } = require('../firebaseAdmin');
const { NotificationService } = require('../services/notificationService');

const db = admin.firestore();
const notificationService = new NotificationService();

/**
 * Sends a daily reminder to all users who have enabled it.
 * Safeguards:
 *  - Skip if user posted today
 *  - Respect preferred reminder hour (if set)
 *  - Enforce quiet hours (if set)
 *  - Enforce daily cooldown (one reminder max per day)
 *  - Skip users with no valid device tokens
 */
const sendDailyReminders = async () => {
  console.log('Running daily reminder job.');

  // Scheduler is already configured with a timezone (see index.js). We assume it runs at the intended local hour.
  const now = new Date();
  const currentHour = now.getHours();

  // Fetch all users; we'll evaluate preferences per-user to support both
  // legacy root fields and the new subcollection schema used by the app.
  const usersSnapshot = await db.collection('users').get();

  if (usersSnapshot.empty) {
    console.log('No users found.');
    return;
  }

  let evaluated = 0;
  let eligible = 0;
  let sentCount = 0;

  await Promise.all(
    usersSnapshot.docs.map(async (doc) => {
      const userId = doc.id;
      const user = doc.data() || {};
      const rootPrefs = user.notificationPreferences || {};
      const state = user.notificationState || {};

      // Read subcollection preferences if present
      let subPrefsData = null;
      try {
        const subSnap = await db
          .collection('users')
          .doc(userId)
          .collection('notificationPreferences')
          .doc('preferences')
          .get();
        subPrefsData = subSnap.exists ? subSnap.data() : null;
      } catch (e) {
        console.warn('Failed to read subcollection preferences for user', userId, e);
      }

      // Determine whether daily reminders are enabled and not globally disabled
      const globalPushEnabled = subPrefsData?.pushNotifications?.enabled;
      const dailyEnabled = ((subPrefsData?.dailyEntries?.enabled === true) || (rootPrefs.dailyReminders === true)) && (globalPushEnabled !== false);

      evaluated++;
      if (!dailyEnabled) return;

      // 1) Preferred hour check (if user set one via legacy root fields)
      const preferredHour = typeof rootPrefs.preferredHour === 'number' ? rootPrefs.preferredHour : null; // 0-23
      if (preferredHour !== null && preferredHour !== currentHour) {
        return; // Not this user's hour
      }

      // 2) Quiet hours check (apply ONLY if explicitly enabled via legacy root fields)
      // Expect quietHoursEnabled: boolean and quietHours: { start: number (0-23), end: number (0-23) }
      const qh = rootPrefs.quietHours;
      const quietEnabled = rootPrefs.quietHoursEnabled === true;
      if (quietEnabled && qh && typeof qh.start === 'number' && typeof qh.end === 'number') {
        const inQuiet = qh.start < qh.end
          ? currentHour >= qh.start && currentHour < qh.end
          : currentHour >= qh.start || currentHour < qh.end; // overnight window
        if (inQuiet) return; // Inside quiet hours, skip
      }

      // 3) Daily cooldown (one reminder per calendar day)
      const lastDailyReminderAt = state.lastDailyReminderAt?.toDate?.() || null;
      if (lastDailyReminderAt) {
        const sameDay = lastDailyReminderAt.toDateString() === now.toDateString();
        if (sameDay) return; // Already reminded today
      }

      // 4) Skip if user posted today (use lastJournalEntryAt if present)
      const lastJournalEntryAt = user.lastJournalEntryAt?.toDate?.() || null;
      if (lastJournalEntryAt) {
        const postedToday = lastJournalEntryAt.toDateString() === now.toDateString();
        if (postedToday) return; // User already active today
      }

      // 5) Ensure user has at least one device token
      const tokens = await notificationService.getUserDeviceTokens(userId);
      if (!tokens || tokens.length === 0) {
        return; // No valid tokens
      }

      eligible++;

      // 6) Send the reminder
      const notification = {
        title: '🌱 Your Daily SproutBook Reminder',
        body: "Don't forget to capture today's precious moments!",
        data: { type: 'daily_reminder' },
      };

      const result = await notificationService.sendPushNotification(userId, notification);
      if (result?.success) {
        sentCount++;
        // Update cooldown timestamp
        await db.collection('users').doc(userId).set(
          { notificationState: { lastDailyReminderAt: admin.firestore.FieldValue.serverTimestamp() } },
          { merge: true }
        );
      }
    })
  );

  console.log(`Evaluated users: ${evaluated}, eligible: ${eligible}, sent: ${sentCount}`);
};

/**
 * Sends a weekly recap reminder to all users who have enabled it.
 */
const sendWeeklyReminders = async () => {
  console.log('Running weekly reminder job.');
  const usersSnapshot = await db.collection('users').get();
  if (usersSnapshot.empty) {
    console.log('No users found.');
    return;
  }
  let sent = 0;
  await Promise.all(
    usersSnapshot.docs.map(async (doc) => {
      const userId = doc.id;
      const user = doc.data() || {};
      const rootPrefs = user.notificationPreferences || {};
      let subPrefsData = null;
      try {
        const subSnap = await db
          .collection('users')
          .doc(userId)
          .collection('notificationPreferences')
          .doc('preferences')
          .get();
        subPrefsData = subSnap.exists ? subSnap.data() : null;
      } catch {}
      const globalPushEnabled = subPrefsData?.pushNotifications?.enabled;
      const weeklyEnabled = ((subPrefsData?.weeklyRecaps?.enabled === true) || (rootPrefs.weeklyRecaps === true)) && (globalPushEnabled !== false);
      if (!weeklyEnabled) return;

      // Ensure user has tokens
      const tokens = await notificationService.getUserDeviceTokens(userId);
      if (!tokens || tokens.length === 0) return;

      const notification = {
        title: '📅 Your Weekly Recap is Ready!',
        body: 'Come see the beautiful moments from the past week.',
        data: { type: 'weekly_recap_reminder' },
      };
      const res = await notificationService.sendPushNotification(userId, notification);
      if (res?.success) sent++;
    })
  );
  console.log(`Sent weekly reminders to ${sent} users.`);
};

/**
 * Sends a monthly recap reminder to all users who have enabled it.
 */
const sendMonthlyReminders = async () => {
  console.log('Running monthly reminder job.');
  const usersSnapshot = await db.collection('users').get();
  if (usersSnapshot.empty) {
    console.log('No users found.');
    return;
  }
  let sent = 0;
  await Promise.all(
    usersSnapshot.docs.map(async (doc) => {
      const userId = doc.id;
      const user = doc.data() || {};
      const rootPrefs = user.notificationPreferences || {};
      let subPrefsData = null;
      try {
        const subSnap = await db
          .collection('users')
          .doc(userId)
          .collection('notificationPreferences')
          .doc('preferences')
          .get();
        subPrefsData = subSnap.exists ? subSnap.data() : null;
      } catch {}
      const globalPushEnabled = subPrefsData?.pushNotifications?.enabled;
      const monthlyEnabled = ((subPrefsData?.monthlyRecaps?.enabled === true) || (rootPrefs.monthlyRecaps === true)) && (globalPushEnabled !== false);
      if (!monthlyEnabled) return;

      // Ensure user has tokens
      const tokens = await notificationService.getUserDeviceTokens(userId);
      if (!tokens || tokens.length === 0) return;

      const notification = {
        title: '🗓️ Your Monthly Recap is Here!',
        body: 'Relive the memories and milestones from the past month.',
        data: { type: 'monthly_recap_reminder' },
      };
      const res = await notificationService.sendPushNotification(userId, notification);
      if (res?.success) sent++;
    })
  );
  console.log(`Sent monthly reminders to ${sent} users.`);
};

module.exports = {
  sendDailyReminders,
  sendWeeklyReminders,
  sendMonthlyReminders,
};
