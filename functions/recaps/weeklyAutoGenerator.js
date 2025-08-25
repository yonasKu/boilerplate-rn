const functions = require('firebase-functions');
const { admin } = require('../firebaseAdmin');
const { AutomatedRecapService } = require('../services/recapGenerator');
const { startOfWeek, endOfWeek, subWeeks } = require('date-fns');

const recapService = new AutomatedRecapService();

/**
 * Scheduled function that runs every Monday at 9:00 AM to generate weekly recaps.
 */
exports.scheduledWeeklyRecaps = functions.pubsub
  .schedule('0 9 * * 1') // Every Monday at 9:00 AM
  .timeZone('America/New_York') // IMPORTANT: Set to your target user timezone
  .onRun(async (context) => {
    console.log('Starting weekly recap generation for all active users.');

    try {
      const activeUsers = await getActiveUsers();
      const promises = [];

      for (const user of activeUsers) {
        const children = await getUserChildren(user.id);
        for (const child of children) {
          const weekRange = getPreviousWeekRange();
          promises.push(recapService.generateWeeklyRecap(user.id, child.id, weekRange));
        }
      }

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Weekly recap generation completed: ${successful} successful, ${failed} failed`);
      return { success: true, generated: successful, failed };
    } catch (error) {
      console.error('Error in weekly recap generation:', error);
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
 * Helper function to get the previous week range
 */
function getPreviousWeekRange() {
  const now = new Date();
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  
  return {
    start: lastWeekStart,
    end: lastWeekEnd
  };
}
