const functions = require('firebase-functions');
const { admin } = require('../firebaseAdmin');
const { AutomatedRecapService } = require('../services/recapGenerator');
const { startOfMonth, endOfMonth, subMonths } = require('date-fns');

const recapService = new AutomatedRecapService();

/**
 * Scheduled function that runs on the 1st of every month to generate monthly recaps.
 */
exports.scheduledMonthlyRecaps = functions.pubsub
  .schedule('0 9 1 * *') // 1st of every month at 9:00 AM
  .timeZone('America/New_York') // IMPORTANT: Set to your target user timezone
  .onRun(async (context) => {
    console.log('Starting monthly recap generation for all active users.');

    try {
      const activeUsers = await getActiveUsers();
      const promises = [];

      for (const user of activeUsers) {
        const children = await getUserChildren(user.id);
        for (const child of children) {
          const monthRange = getPreviousMonthRange();
          promises.push(recapService.generateMonthlyRecap(user.id, child.id, monthRange));
        }
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Monthly recap generation completed: ${successful} successful, ${failed} failed`);
      return { success: true, generated: successful, failed };
    } catch (error) {
      console.error('Error in monthly recap generation:', error);
      return { success: false, error: error.message };
    }
  });

/**
 * Helper function to get active users
 */
async function getActiveUsers() {
  const db = admin.firestore();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const usersSnapshot = await db.collection('users')
    .where('lastLoginAt', '>=', thirtyDaysAgo)
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
    .where('userId', '==', userId)
    .get();
  
  return childrenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Helper function to get the previous month range
 */
function getPreviousMonthRange() {
  const now = new Date();
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  
  return {
    start: lastMonthStart,
    end: lastMonthEnd
  };
}
