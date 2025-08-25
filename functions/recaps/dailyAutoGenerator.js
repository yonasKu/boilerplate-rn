const functions = require('firebase-functions');
const { admin } = require('../firebaseAdmin');
const { AutomatedRecapService } = require('../services/recapGenerator');
const { startOfDay, endOfDay, subDays } = require('date-fns');

const recapService = new AutomatedRecapService();

/**
 * Scheduled function that runs every 3 hours to generate daily recaps.
 */
exports.scheduledDailyRecaps = functions.pubsub
  .schedule('0 */3 * * *') // Every 3 hours
  .timeZone(process.env.DEFAULT_TIMEZONE || 'America/New_York') // IMPORTANT: Set to your target user timezone
  .onRun(async (context) => {
    console.log('Starting daily recap generation for all active users.');
    console.log('Admin SDK project (runtime):', admin.app().options.projectId);

    try {
      const activeUsers = await getActiveUsers();
      const promises = [];

      for (const user of activeUsers) {
        const children = await getUserChildren(user.id);
        for (const child of children) {
          const dateRange = getPreviousDayRange();
          promises.push(recapService.generateDailyRecap(user.id, child.id, dateRange));
        }
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Daily recap generation completed: ${successful} successful, ${failed} failed`);
      return { success: true, generated: successful, failed };
    } catch (error) {
      console.error('Error in daily recap generation:', error);
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
 * Helper function to get the previous day range
 */
function getPreviousDayRange() {
  const now = new Date();
  const yesterdayStart = startOfDay(subDays(now, 1));
  const yesterdayEnd = endOfDay(subDays(now, 1));
  
  return {
    start: yesterdayStart,
    end: yesterdayEnd
  };
}
