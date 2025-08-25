const functions = require('firebase-functions');
const { admin } = require('../firebaseAdmin');
const { AutomatedRecapService } = require('../services/recapGenerator');
const { startOfYear, endOfYear, subYears } = require('date-fns');

const recapService = new AutomatedRecapService();

/**
 * Scheduled function that runs on January 1st to generate yearly recaps.
 */
exports.scheduledYearlyRecaps = functions.pubsub
  .schedule('0 9 1 1 *') // January 1st at 9:00 AM
  .timeZone(process.env.DEFAULT_TIMEZONE || 'America/New_York') // IMPORTANT: Set to your target user timezone
  .onRun(async (context) => {
    console.log('Starting yearly recap generation for all active users.');

    try {
      const activeUsers = await getActiveUsers();
      const promises = [];

      for (const user of activeUsers) {
        const children = await getUserChildren(user.id);
        for (const child of children) {
          const yearRange = getPreviousYearRange();
          promises.push(recapService.generateYearlyRecap(user.id, child.id, yearRange));
        }
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Yearly recap generation completed: ${successful} successful, ${failed} failed`);
      return { success: true, generated: successful, failed };
    } catch (error) {
      console.error('Error in yearly recap generation:', error);
      return { success: false, error: error.message };
    }
  });

/**
 * Helper function to get active users
 */
async function getActiveUsers() {
  const db = admin.firestore();
  const usersSnapshot = await db.collection('users')
    .limit(50)
    .get();
  
  return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Helper function to get children for a user
 */
async function getUserChildren(userId) {
  const db = admin.firestore();
  const childrenSnapshot = await db.collection('children')
    .where('parentId', '==', userId)
    .get();
  
  return childrenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Helper function to get the previous year range
 */
function getPreviousYearRange() {
  const now = new Date();
  const lastYearStart = startOfYear(subYears(now, 1));
  const lastYearEnd = endOfYear(subYears(now, 1));
  
  return {
    start: lastYearStart,
    end: lastYearEnd
  };
}
