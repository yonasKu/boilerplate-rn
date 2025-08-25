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

  const usersSnapshot = await db
    .collection('users')
    .where('notificationPreferences.dailyReminders', '==', true)
    .get();

  if (usersSnapshot.empty) {
    console.log('No users for daily reminders.');
    return;
  }

  let sentCount = 0;

  await Promise.all(
    usersSnapshot.docs.map(async (doc) => {
      const userId = doc.id;
      const user = doc.data() || {};
      const prefs = user.notificationPreferences || {};
      const state = user.notificationState || {};

      // 1) Preferred hour check (if user set one)
      const preferredHour = typeof prefs.preferredHour === 'number' ? prefs.preferredHour : null; // 0-23
      if (preferredHour !== null && preferredHour !== currentHour) {
        return; // Not this user's hour
      }

      // 2) Quiet hours check (apply ONLY if explicitly enabled)
      // Expect quietHoursEnabled: boolean and quietHours: { start: number (0-23), end: number (0-23) }
      const qh = prefs.quietHours;
      const quietEnabled = prefs.quietHoursEnabled === true;
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

  console.log(`Sent daily reminders to ${sentCount} users.`);
};

/**
 * Sends a weekly recap reminder to all users who have enabled it.
 */
const sendWeeklyReminders = async () => {
  console.log('Running weekly reminder job.');
  const usersSnapshot = await db.collection('users')
    .where('notificationPreferences.weeklyRecaps', '==', true)
    .get();

  if (usersSnapshot.empty) {
    console.log('No users for weekly reminders.');
    return;
  }

  const reminderPromises = usersSnapshot.docs.map(doc => {
    const userId = doc.id;
    const notification = {
      title: '📅 Your Weekly Recap is Ready!',
      body: 'Come see the beautiful moments from the past week.',
      data: { type: 'weekly_recap_reminder' },
    };
    return notificationService.sendPushNotification(userId, notification);
  });

  await Promise.all(reminderPromises);
  console.log(`Sent weekly reminders to ${usersSnapshot.size} users.`);
};

/**
 * Sends a monthly recap reminder to all users who have enabled it.
 */
const sendMonthlyReminders = async () => {
  console.log('Running monthly reminder job.');
  const usersSnapshot = await db.collection('users')
    .where('notificationPreferences.monthlyRecaps', '==', true)
    .get();

  if (usersSnapshot.empty) {
    console.log('No users for monthly reminders.');
    return;
  }

  const reminderPromises = usersSnapshot.docs.map(doc => {
    const userId = doc.id;
    const notification = {
      title: '🗓️ Your Monthly Recap is Here!',
      body: 'Relive the memories and milestones from the past month.',
      data: { type: 'monthly_recap_reminder' },
    };
    return notificationService.sendPushNotification(userId, notification);
  });

  await Promise.all(reminderPromises);
  console.log(`Sent monthly reminders to ${usersSnapshot.size} users.`);
};

module.exports = {
  sendDailyReminders,
  sendWeeklyReminders,
  sendMonthlyReminders,
};
