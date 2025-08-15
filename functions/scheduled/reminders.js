const { admin } = require('../firebaseAdmin');
const { NotificationService } = require('../services/notificationService');

const db = admin.firestore();
const notificationService = new NotificationService();

/**
 * Sends a daily reminder to all users who have enabled it.
 */
const sendDailyReminders = async () => {
  console.log('Running daily reminder job.');
  const usersSnapshot = await db.collection('users')
    .where('notificationPreferences.dailyReminders', '==', true)
    .get();

  if (usersSnapshot.empty) {
    console.log('No users for daily reminders.');
    return;
  }

  const reminderPromises = usersSnapshot.docs.map(doc => {
    const userId = doc.id;
    const notification = {
      title: '🌱 Your Daily SproutBook Reminder',
      body: "Don't forget to capture today's precious moments!",
      data: { type: 'daily_reminder' },
    };
    return notificationService.sendPushNotification(userId, notification);
  });

  await Promise.all(reminderPromises);
  console.log(`Sent daily reminders to ${usersSnapshot.size} users.`);
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
