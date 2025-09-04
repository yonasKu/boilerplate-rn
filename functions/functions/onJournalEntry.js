/**
 * Automatic Journal Entry Trigger
 * Triggers when ANY real user posts a journal entry
 * Immediately sends push notifications and generates all recap types
 */

const functions = require('firebase-functions');
const { admin } = require('../firebaseAdmin');
const { AutomatedRecapService } = require('../services/recapGenerator');
const { NotificationService } = require('../services/notificationService');
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } = require('date-fns');

const recapService = new AutomatedRecapService();
// const notificationService = new NotificationService(); // No longer used; recap notifications are sent by the generator

/**
 * Trigger: Firestore onCreate for journalEntries
 * Runs immediately when ANY user posts a journal entry
 */
exports.onJournalEntryCreated = functions.firestore
  .document('journalEntries/{entryId}')
  .onCreate(async (snap, context) => {
    const entry = snap.data();
    const entryId = context.params.entryId;
    
    console.log(`📝 New journal entry created: ${entryId} by user ${entry.userId}`);
    
    try {
      // 1. Immediately send push notification for new entry
      // Disabled to avoid extra notifications; journal-entry push not required now
      // await sendImmediateNotification(entry.userId, entry);

      // 2. Check if user has enough entries for recaps and generate them
      await checkAndGenerateRecaps(entry.userId, entry.childIds || []);

      // 3. Update user activity and engagement metrics
      await updateUserEngagement(entry.userId);
      
      console.log(`✅ Successfully processed journal entry ${entryId}`);
      return { success: true };
      
    } catch (error) {
      console.error(`❌ Error processing journal entry ${entryId}:`, error);
      return { success: false, error: error.message };
    }
  });

/**
 * Check if user has enough entries and generate recaps
 * - Thresholds are computed at USER-level across all children
 * - Weekly: generate ONE user-scoped weekly_snippet (aggregated children)
 * - Monthly/Yearly: when user-level threshold is met, generate per-child recaps for children with entries in that period
 */
async function checkAndGenerateRecaps(userId, childIds) {
  try {
    const now = new Date();

    const weeklyRange = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    const monthlyRange = { start: startOfMonth(now), end: endOfMonth(now) };
    const yearlyRange = { start: startOfYear(now), end: endOfYear(now) };

    // User-level counts
    const weeklyUserCount = await countUserJournalEntries(userId, weeklyRange);
    const monthlyUserCount = await countUserJournalEntries(userId, monthlyRange);
    const yearlyUserCount = await countUserJournalEntries(userId, yearlyRange);
    console.log(`📊 User-level counts - Weekly: ${weeklyUserCount}, Monthly: ${monthlyUserCount}, Yearly: ${yearlyUserCount}`);

    const recapResults = [];

    // Weekly: user-level snippet
    if (weeklyUserCount >= 3) {
      try {
        const res = await recapService.generateWeeklySnippet(userId, weeklyRange, { source: 'auto' });
        recapResults.push({ type: 'weekly_snippet', ...res });
        console.log(`📅 Weekly snippet generated/attempted for user ${userId}`);
      } catch (e) {
        console.error('Error generating weekly_snippet from trigger:', e);
      }
    }

    // Monthly: per-child only if user-level threshold met
    if (monthlyUserCount >= 5) {
      for (const childId of childIds) {
        const childMonthlyCount = await countJournalEntries(userId, childId, monthlyRange);
        if (childMonthlyCount > 0) {
          const monthlyRecap = await recapService.generateMonthlyRecap(userId, childId, monthlyRange);
          recapResults.push({ type: 'monthly', childId, ...monthlyRecap });
          console.log(`📅 Monthly recap generated for ${userId}/${childId}`);
        }
      }
    }

    // Yearly: per-child only if user-level threshold met
    if (yearlyUserCount >= 10) {
      for (const childId of childIds) {
        const childYearlyCount = await countJournalEntries(userId, childId, yearlyRange);
        if (childYearlyCount > 0) {
          const yearlyRecap = await recapService.generateYearlyRecap(userId, childId, yearlyRange);
          recapResults.push({ type: 'yearly', childId, ...yearlyRecap });
          console.log(`📅 Yearly recap generated for ${userId}/${childId}`);
        }
      }
    }

    return recapResults;
  } catch (error) {
    console.error('Error checking and generating recaps:', error);
    return [];
  }
}

/**
 * Count journal entries for a specific period at the user level (across all children)
 */
async function countUserJournalEntries(userId, dateRange) {
  try {
    const snapshot = await admin.firestore()
      .collection('journalEntries')
      .where('userId', '==', userId)
      .where('createdAt', '>=', dateRange.start)
      .where('createdAt', '<=', dateRange.end)
      .count()
      .get();
    return snapshot.data().count;
  } catch (error) {
    console.error('Error counting user-level journal entries:', error);
    return 0;
  }
}

/**
 * Send immediate push notification for new journal entry
 */
async function sendImmediateNotification(userId, entry) {
  try {
    // Get user's device tokens
    const tokensSnapshot = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('devices')
      .get();
    
    if (tokensSnapshot.empty) {
      console.log(`No device tokens found for user ${userId}`);
      return { success: false, reason: 'No device tokens' };
    }
    
    const tokens = tokensSnapshot.docs.map(doc => doc.id);
    
    // Create notification message
    const message = {
      notification: {
        title: 'New Journal Entry Added! 📔',
        body: entry.text.length > 50 
          ? entry.text.substring(0, 47) + '...' 
          : entry.text,
      },
      data: {
        type: 'journal_entry',
        entryId: entry.id || '',
        userId: userId,
        timestamp: new Date().toISOString(),
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'journal_entries',
          icon: 'ic_notification',
          color: '#FF6B6B'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            category: 'JOURNAL_ENTRY'
          }
        }
      }
    };
    
    // Send notification to all devices
    const response = await admin.messaging().sendMulticast({
      tokens: tokens,
      ...message
    });
    
    console.log(`📱 Push notification sent to ${response.successCount} devices`);
    
    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/invalid-registration') {
          invalidTokens.push(tokens[idx]);
        }
      });
      
      if (invalidTokens.length > 0) {
        await cleanupInvalidTokens(userId, invalidTokens);
      }
    }
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
    
  } catch (error) {
    console.error('Error sending immediate notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Count journal entries for a specific period
 */
async function countJournalEntries(userId, childId, dateRange) {
  try {
    const snapshot = await admin.firestore()
      .collection('journalEntries')
      .where('userId', '==', userId)
      .where('childIds', 'array-contains', childId)
      .where('createdAt', '>=', dateRange.start)
      .where('createdAt', '<=', dateRange.end)
      .count()
      .get();
    
    return snapshot.data().count;
  } catch (error) {
    console.error('Error counting journal entries:', error);
    return 0;
  }
}

/**
 * Send notification for generated recap
 */
async function sendRecapNotification(userId, recapType, recapId) {
  try {
    const tokensSnapshot = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('devices')
      .get();
    
    if (tokensSnapshot.empty) return;
    
    const tokens = tokensSnapshot.docs.map(doc => doc.id);
    
    const recapTitles = {
      weekly: 'Weekly Recap Ready! 📊',
      monthly: 'Monthly Recap Ready! 📊',
      yearly: 'Yearly Recap Ready! 📊'
    };
    
    const message = {
      notification: {
        title: recapTitles[recapType],
        body: `Your ${recapType} recap has been generated with your latest journal entries!`,
      },
      data: {
        type: 'recap_generated',
        recapType: recapType,
        recapId: recapId,
        userId: userId,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      }
    };
    
    await admin.messaging().sendMulticast({
      tokens: tokens,
      ...message
    });
    
    console.log(`📱 ${recapType} recap notification sent to user ${userId}`);
    
  } catch (error) {
    console.error('Error sending recap notification:', error);
  }
}

/**
 * Update user engagement metrics
 */
async function updateUserEngagement(userId) {
  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    
    await userRef.update({
      lastJournalEntryAt: admin.firestore.FieldValue.serverTimestamp(),
      totalJournalEntries: admin.firestore.FieldValue.increment(1)
    });
    
    console.log(`📊 Updated engagement metrics for user ${userId}`);
    
  } catch (error) {
    console.error('Error updating user engagement:', error);
  }
}

/**
 * Clean up invalid device tokens
 */
async function cleanupInvalidTokens(userId, invalidTokens) {
  try {
    const batch = admin.firestore().batch();
    
    for (const token of invalidTokens) {
      const tokenRef = admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('devices')
        .doc(token);
      
      batch.delete(tokenRef);
    }
    
    await batch.commit();
    console.log(`🧹 Cleaned up ${invalidTokens.length} invalid tokens`);
    
  } catch (error) {
    console.error('Error cleaning up invalid tokens:', error);
  }
}
