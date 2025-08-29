// Load environment variables
require('dotenv').config({ path: __dirname + '/.env' });

// Log environment loading for debugging
console.log('Loading environment variables...');
console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
console.log('PROJECT_ID present:', !!process.env.PROJECT_ID);

const functions = require("firebase-functions");
const { onRequest } = require('firebase-functions/v2/https');
const { admin } = require('./firebaseAdmin');
const { validateEnvironment } = require('./utils/environmentValidator');
const { revenuecatWebhook } = require('./functions/revenuecatWebhook');
// Use HTTP v2 modules (old style)
const referralsHttp = require('./functions/http/referrals');
const familyHttp = require('./functions/http/family');
const notificationsHttp = require('./functions/http/notifications');
// Keep Recaps as HTTP v2 to avoid deleting existing v2 HTTP recaps
const recapsHttp = require('./functions/http/recaps');
const { AutomatedRecapService } = require('./services/recapGenerator');

// Validate environment variables with better error handling
try {
  console.log('Validating environment variables...');
  validateEnvironment();
  console.log(' Environment variables validated successfully');
} catch (error) {
  console.error(' Environment validation failed:', error.message);
  // Log which variables are missing
  const requiredVars = ['PROJECT_ID', 'OPENAI_API_KEY'];
  requiredVars.forEach(varName => {
    console.log(`${varName}: ${process.env[varName] ? ' Present' : ' Missing'}`);
  });
  // Don't throw error to allow emulator to start for debugging
}

// --- Automated Recap Functions ---
// moved to './functions/http/recaps'

// --- Journal Entry Trigger ---
const { onJournalEntryCreated } = require('./functions/onJournalEntry');

// Export the journal entry trigger
exports.onJournalEntryCreated = onJournalEntryCreated;

// RevenueCat webhook endpoint
exports.revenuecatWebhook = revenuecatWebhook;

// --- HTTP v2: Referrals/Promo ---
exports.redeemPromoCode = referralsHttp.redeemPromoCode;
exports.generateReferralCode = referralsHttp.generateReferralCode;
exports.processReferral = referralsHttp.processReferral;
exports.getReferralStats = referralsHttp.getReferralStats;

// --- HTTP v2: Recap triggers (keep as HTTP)
exports.generateWeeklyRecap = recapsHttp.generateWeeklyRecap;
exports.generateMonthlyRecap = recapsHttp.generateMonthlyRecap;
exports.generateYearlyRecap = recapsHttp.generateYearlyRecap;

// --- HTTP v2: Notifications ---
exports.sendTestNotification = notificationsHttp.sendTestNotification;
exports.registerDeviceToken = notificationsHttp.registerDeviceToken;
exports.removeDeviceToken = notificationsHttp.removeDeviceToken;

// --- HTTP v2: Family sharing ---
exports.familyCreateInvitation = familyHttp.familyCreateInvitation;
exports.familyAcceptInvitation = familyHttp.familyAcceptInvitation;
exports.familyUpdatePermissions = familyHttp.familyUpdatePermissions;
exports.familyRevokeAccess = familyHttp.familyRevokeAccess;
exports.familyGetSharedAccess = familyHttp.familyGetSharedAccess;
exports.familyGetInvitations = familyHttp.familyGetInvitations;
exports.familyGetAccountStatus = familyHttp.familyGetAccountStatus;

// Referral/Promo HTTP handlers moved to './functions/http/referrals'

// generateRecapsForAllUsers function was removed

// Recap HTTP handlers moved to './functions/http/recaps'

// Scheduled function for monthly recaps
exports.scheduledMonthlyRecaps = functions.pubsub.schedule('0 9 1 * *')
  .timeZone(process.env.DEFAULT_TIMEZONE || 'America/New_York')
  .onRun(async (context) => {
    console.log('Running scheduled monthly recaps...');
    console.log('Admin SDK project (runtime):', admin.app().options.projectId);
    const recapService = new AutomatedRecapService();
    return await recapService.generateAllMonthlyRecaps();
  });

// Scheduled function for weekly recaps
exports.scheduledWeeklyRecaps = functions.pubsub.schedule('0 9 * * 1')
  .timeZone(process.env.DEFAULT_TIMEZONE || 'America/New_York')
  .onRun(async (context) => {
    console.log('Running scheduled weekly recaps...');
    console.log('Admin SDK project (runtime):', admin.app().options.projectId);
    const recapService = new AutomatedRecapService();
    return await recapService.generateAllWeeklyRecaps();
  });

// Scheduled function for yearly recaps
exports.scheduledYearlyRecaps = functions.pubsub.schedule('0 9 1 1 *')
  .timeZone(process.env.DEFAULT_TIMEZONE || 'America/New_York')
  .onRun(async (context) => {
    console.log('Running scheduled yearly recaps...');
    console.log('Admin SDK project (runtime):', admin.app().options.projectId);
    const recapService = new AutomatedRecapService();
    return await recapService.generateAllYearlyRecaps();
  });

// --- Test Functions ---

// Notification HTTP handlers moved to './functions/http/notifications'

// --- Test Recap Function for All Users ---
const { generateAllUsersTestRecaps } = require('./functions/testRecaps');
exports.generateAllUsersTestRecaps = generateAllUsersTestRecaps;

// --- Recap Interactions (Comments & Likes) ---
const { onRecapCommentCreated, onRecapLikesUpdated } = require('./functions/onRecapInteraction');
exports.onRecapCommentCreated = onRecapCommentCreated;
exports.onRecapLikesUpdated = onRecapLikesUpdated;


// --- Notification Device Token Management ---
const { NotificationService } = require('./services/notificationService');
const { sendDailyReminders, sendWeeklyReminders, sendMonthlyReminders } = require('./scheduled/reminders');

// Device token HTTP handlers moved to './functions/http/notifications'


// --- Scheduled Functions ---

/**
 * A scheduled function that runs every day at 9:00 AM to send daily reminders.
 */
exports.dailyReminderScheduler = functions.pubsub
  .schedule('every day 09:00')
  .timeZone(process.env.DEFAULT_TIMEZONE || 'America/New_York')
  .onRun(async (context) => {
    try {
      await sendDailyReminders();
      return null;
    } catch (error) {
      console.error('Error running daily reminder scheduler:', error);
      return null;
    }
  });

/**
 * A scheduled function that runs every Sunday at 10:00 AM to send weekly recap reminders.
 */
exports.weeklyReminderScheduler = functions.pubsub
  .schedule('every sunday 10:00')
  .timeZone(process.env.DEFAULT_TIMEZONE || 'America/New_York')
  .onRun(async (context) => {
    try {
      await sendWeeklyReminders();
      return null;
    } catch (error) {
      console.error('Error running weekly reminder scheduler:', error);
      return null;
    }
  });

/**
 * A scheduled function that runs on the 1st of every month at 10:00 AM to send monthly recap reminders.
 */
exports.monthlyReminderScheduler = functions.pubsub
  .schedule('1 of month 10:00')
  .timeZone(process.env.DEFAULT_TIMEZONE || 'America/New_York')
  .onRun(async (context) => {
    try {
      await sendMonthlyReminders();
      return null;
    } catch (error) {
      console.error('Error running monthly reminder scheduler:', error);
      return null;
    }
  });

// --- Test Connection Function ---
const { testConnection } = require('./functions/testConnection');
exports.testConnection = testConnection;

// Family sharing HTTP handlers moved to './functions/http/family'
