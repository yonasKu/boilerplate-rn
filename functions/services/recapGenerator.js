const JournalAggregator = require('./journalAggregator');
const OpenAIService = require('./openAIService');
const { NotificationService } = require('./notificationService');

class AutomatedRecapService {
  constructor() {
    this.journalAggregator = new JournalAggregator();
    this.openAIService = new OpenAIService();
    this.notificationService = new NotificationService();
    this.db = require('../firebaseAdmin').db;
  }

  /**
   * Generate weekly recap for a user and child
   * @param {string} userId - User ID
   * @param {string} childId - Child ID
   * @param {Object} weekRange - Date range for the week
   * @returns {Promise<Object>} Generated recap
   */
  async generateWeeklyRecap(userId, childId, weekRange) {
    const operationId = `weekly_recap_${userId}_${childId}_${Date.now()}`;
    const startTime = Date.now();
    
    try {
      console.log(`[${operationId}] Starting weekly recap generation`, {
        userId,
        childId,
        weekRange
      });

      const journalData = await this.journalAggregator.aggregateJournalEntries({
        userId,
        childId,
        type: 'weekly',
        startDate: weekRange.start,
        endDate: weekRange.end
      });

      if (journalData.totalEntries < 3) {
        console.log(`[${operationId}] Insufficient entries for weekly recap: ${journalData.totalEntries}`);
        return {
          success: false,
          message: 'Insufficient entries for recap generation',
          totalEntries: journalData.totalEntries,
          minimumRequired: 3
        };
      }

      const aiContent = await this.openAIService.generateRecap(journalData, 'weekly');
      const aiTitleRaw = await this.openAIService.generateRecapTitle(journalData, 'weekly', { start: weekRange.start, end: weekRange.end });
      
      const weekStart = weekRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const weekEnd = weekRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const easyTitle = `${journalData.childName}'s Week ${weekStart} - ${weekEnd}`;
      const title = (aiTitleRaw && aiTitleRaw.length > 0) ? aiTitleRaw : easyTitle;
      
      const recap = {
        userId,
        childId,
        type: 'weekly',
        title,
        period: {
          startDate: weekRange.start,
          endDate: weekRange.end
        },
        aiGenerated: aiContent,
        childName: journalData.childName,
        childAge: journalData.childAge || 'Age not specified',
        summary: journalData.summary,
        imageMetadata: journalData.imageMetadata || {
          count: 0,
          hasImages: false,
          imageTypes: [],
          totalSize: 0
        },
        status: 'completed',
        createdAt: new Date(),
        processingTime: Date.now() - startTime
      };

      const docRef = await this.db.collection('recaps').add(recap);
      console.log(`[${operationId}] Weekly recap generated successfully: ${docRef.id}`);
      
      // Send notification
      await this.sendRecapNotification(userId, childId, 'weekly', docRef.id, journalData.childName);
      
      return {
        success: true,
        id: docRef.id,
        userId,
        createdAt: recap.createdAt.toISOString(),
        ...recap
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[${operationId}] Weekly recap generation failed`, {
        error: error.message,
        processingTime,
        userId,
        childId
      });
      
      return {
        success: false,
        error: error.message,
        processingTime,
        userId,
        childId
      };
    }
  }

  /**
   * Generate monthly recap for a user and child
   * @param {string} userId - User ID
   * @param {string} childId - Child ID
   * @param {Object} monthRange - Date range for the month
   * @returns {Promise<Object>} Generated recap
   */
  async generateMonthlyRecap(userId, childId, monthRange) {
    const operationId = `monthly_recap_${userId}_${childId}_${Date.now()}`;
    const startTime = Date.now();
    
    try {
      console.log(`[${operationId}] Starting monthly recap generation`, {
        userId,
        childId,
        monthRange
      });

      const journalData = await this.journalAggregator.aggregateJournalEntries({
        userId,
        childId,
        type: 'monthly',
        startDate: monthRange.start,
        endDate: monthRange.end
      });

      if (journalData.totalEntries < 5) {
        console.log(`[${operationId}] Insufficient entries for monthly recap: ${journalData.totalEntries}`);
        return {
          success: false,
          message: 'Insufficient entries for recap generation',
          totalEntries: journalData.totalEntries,
          minimumRequired: 5
        };
      }

      const aiContent = await this.openAIService.generateRecap(journalData, 'monthly');
      const aiTitleRaw = await this.openAIService.generateRecapTitle(journalData, 'monthly', { start: monthRange.start, end: monthRange.end });
      
      const monthName = monthRange.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const easyTitle = `${journalData.childName}'s ${monthName}`;
      const desiredTitle = aiTitleRaw && aiTitleRaw.length > 0 ? aiTitleRaw : easyTitle;
      const title = desiredTitle;
      
      const recap = {
        userId,
        childId,
        type: 'monthly',
        title,
        period: {
          startDate: monthRange.start,
          endDate: monthRange.end
        },
        aiGenerated: aiContent,
        childName: journalData.childName,
        childAge: journalData.childAge || 'Age not specified',
        summary: journalData.summary,
        imageMetadata: journalData.imageMetadata || {
          count: 0,
          hasImages: false,
          imageTypes: [],
          totalSize: 0
        },
        status: 'completed',
        createdAt: new Date(),
        processingTime: Date.now() - startTime
      };

      const docRef = await this.db.collection('recaps').add(recap);
      console.log(`[${operationId}] Monthly recap generated successfully: ${docRef.id}`);
      
      // Send notification
      await this.sendRecapNotification(userId, childId, 'monthly', docRef.id, journalData.childName);
      
      return {
        success: true,
        id: docRef.id,
        userId,
        createdAt: recap.createdAt.toISOString(),
        ...recap
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[${operationId}] Monthly recap generation failed`, {
        error: error.message,
        processingTime,
        userId,
        childId
      });
      
      return {
        success: false,
        error: error.message,
        processingTime,
        userId,
        childId
      };
    }
  }

  /**
   * Generate yearly recap for a user and child
   * @param {string} userId - User ID
   * @param {string} childId - Child ID
   * @param {Object} yearRange - Date range for the year
   * @returns {Promise<Object>} Generated recap
   */
  async generateYearlyRecap(userId, childId, yearRange) {
    const operationId = `yearly_recap_${userId}_${childId}_${Date.now()}`;
    const startTime = Date.now();
    
    try {
      console.log(`[${operationId}] Starting yearly recap generation`, {
        userId,
        childId,
        yearRange
      });

      const journalData = await this.journalAggregator.aggregateJournalEntries({
        userId,
        childId,
        type: 'yearly',
        startDate: yearRange.start,
        endDate: yearRange.end
      });

      if (journalData.totalEntries < 10) {
        console.log(`[${operationId}] Insufficient entries for yearly recap: ${journalData.totalEntries}`);
        return {
          success: false,
          message: 'Insufficient entries for recap generation',
          totalEntries: journalData.totalEntries,
          minimumRequired: 10
        };
      }

      const aiContent = await this.openAIService.generateRecap(journalData, 'yearly');
      const aiTitleRaw = await this.openAIService.generateRecapTitle(journalData, 'yearly', { start: yearRange.start, end: yearRange.end });
      
      const year = yearRange.start.getFullYear();
      const easyTitle = `${journalData.childName}'s ${year} Year in Review`;
      const desiredTitle = aiTitleRaw && aiTitleRaw.length > 0 ? aiTitleRaw : easyTitle;
      const title = desiredTitle;
      
      const recap = {
        userId,
        childId,
        type: 'yearly',
        title,
        content: aiContent.recapText,
        generatedAt: new Date(),
        periodStart: yearRange.start,
        periodEnd: yearRange.end,
        totalEntries: journalData.totalEntries,
        childName: journalData.childName,
        childAge: journalData.childAge || 'Age not specified',
        summary: journalData.summary,
        imageMetadata: journalData.imageMetadata || {
          count: 0,
          hasImages: false,
          imageTypes: [],
          totalSize: 0
        },
        status: 'completed',
        createdAt: new Date()
      };

      const docRef = await this.db.collection('recaps').add(recap);
      console.log(`[${operationId}] Yearly recap generated successfully: ${docRef.id}`);
      
      // Send notification
      await this.sendRecapNotification(userId, childId, 'yearly', docRef.id, journalData.childName);
      
      return {
        success: true,
        id: docRef.id,
        userId,
        createdAt: recap.createdAt.toISOString(),
        ...recap
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[${operationId}] Yearly recap generation failed`, {
        error: error.message,
        processingTime,
        userId,
        childId
      });
      
      return {
        success: false,
        error: error.message,
        processingTime,
        userId,
        childId
      };
    }
  }

  async generateAllWeeklyRecaps() {
    return await this.generateAllRecaps('weekly');
  }

  async generateAllMonthlyRecaps() {
    return await this.generateAllRecaps('monthly');
  }

  async generateAllYearlyRecaps() {
    return await this.generateAllRecaps('yearly');
  }

  async generateAllRecaps(type) {
    const results = {
      totalUsers: 0,
      totalChildren: 0,
      successfulRecaps: 0,
      failedRecaps: 0,
      skippedRecaps: 0,
      details: []
    };

    const dateCalculators = {
      weekly: () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        return { start: startDate, end: endDate };
      },
      monthly: () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1);
        startDate.setDate(1);
        return { start: startDate, end: endDate };
      },
      yearly: () => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        return { start: startDate, end: endDate };
      }
    };

    try {
      console.log(`Starting ${type} recap generation for all users...`);

      const usersSnapshot = await this.db.collection('users').get();
      results.totalUsers = usersSnapshot.docs.length;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const childrenSnapshot = await this.db.collection('children').where('parentId', '==', userId).get();

        for (const childDoc of childrenSnapshot.docs) {
          const childId = childDoc.id;
          results.totalChildren++;

          try {
            const dateRange = dateCalculators[type]();
            let result;
            switch (type) {
              case 'weekly':
                result = await this.generateWeeklyRecap(userId, childId, dateRange);
                break;
              case 'monthly':
                result = await this.generateMonthlyRecap(userId, childId, dateRange);
                break;
              case 'yearly':
                result = await this.generateYearlyRecap(userId, childId, dateRange);
                break;
            }
            
            if (result.success) {
              results.successfulRecaps++;
              results.details.push({ userId, childId, status: 'success', recapId: result.id });
              
              // Send notification for bulk generation
              const childName = childDoc.data()?.name || 'Your child';
              await this.sendRecapNotification(userId, childId, type, result.id, childName);
            } else if (result.message && result.message.includes('Insufficient entries')) {
              results.skippedRecaps++;
              results.details.push({ userId, childId, status: 'skipped', reason: result.message });
            } else {
              results.failedRecaps++;
              results.details.push({ userId, childId, status: 'failed', error: result.error || 'Unknown error' });
            }
          } catch (error) {
            results.failedRecaps++;
            results.details.push({ userId, childId, status: 'failed', error: error.message });
          }
        }
      }

      console.log(`${type} recap generation completed:`, results);
      return results;
    } catch (error) {
      console.error(`Error in generateAllRecaps for type ${type}:`, error);
      throw error;
    }
  }

  async callAIProvider(entries, type) {
    console.log(`Calling AI provider for ${type} recap with ${entries.length} entries.`);
    return { title: 'AI Generated Title', summary: 'AI generated summary.', keyMoments: [], sentiment: 'positive' };
  }

  async saveRecap(userId, childId, type, dateRange, aiResponse, journalData = {}) {
    const baseTitleFromRange = (() => {
      try {
        const startFmt = dateRange?.start?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endFmt = dateRange?.end?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (type === 'monthly') {
          return dateRange?.start?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) || 'Monthly Recap';
        }
        if (type === 'yearly') {
          return `${dateRange?.start?.getFullYear?.() || ''} Year in Review`.trim();
        }
        return `Week ${startFmt} - ${endFmt}`;
      } catch {
        return 'Recap';
      }
    })();
    const desiredTitle = (aiResponse && aiResponse.title) ? aiResponse.title : baseTitleFromRange;
    const title = desiredTitle;

    const recapData = {
      userId,
      childId,
      type,
      period: {
        startDate: dateRange.start,
        endDate: dateRange.end
      },
      aiGenerated: aiResponse,
      title,
      imageMetadata: journalData.imageMetadata || { count: 0, hasImages: false, imageTypes: [] },
      status: 'completed',
      createdAt: new Date(),
      generatedAt: new Date()
    };

    const recapRef = await this.db.collection('recaps').add(recapData);
    console.log(`Saving ${type} recap ${recapRef.id} for child ${childId}.`);
    return recapRef.id;
  }

  /**
   * Generate and persist a journal-scoped weekly snippet recap
   * - Aggregates across ALL children for the user within the week
   * - Persists with deterministic id (idempotent)
   * - Does NOT send a notification (snippet is a manual save UX)
   * @param {string} userId
   * @param {{start: Date, end: Date}} weekRange
   * @param {{ source?: 'http'|'auto'|'schedule' }} options
   */
  async generateWeeklySnippet(userId, weekRange, options = {}) {
    const opId = `weekly_snippet_${userId}_${Date.now()}`;
    const startTime = Date.now();
    const { start, end } = weekRange || {};
    const source = options.source || 'http';

    try {
      if (!userId || !(start instanceof Date) || !(end instanceof Date)) {
        throw new Error('Invalid inputs for generateWeeklySnippet');
      }

      const journalData = await this.journalAggregator.aggregateJournalEntries({
        userId,
        type: 'weekly',
        startDate: start,
        endDate: end,
      });

      if (journalData.totalEntries < 3) {
        return {
          success: false,
          message: 'Insufficient entries for weekly snippet',
          totalEntries: journalData.totalEntries,
          minimumRequired: 3,
        };
      }

      const aiContent = await this.openAIService.generateRecap(journalData, 'weekly');
      const aiTitleRaw = await this.openAIService.generateRecapTitle(journalData, 'weekly_snippet', { start, end });

      const { createHash } = require('crypto');
      const startISO = start.toISOString();
      const endISO = end.toISOString();
      const keyMaterial = `${userId}|weekly_snippet|${startISO}|${endISO}`;
      const recapKey = createHash('sha1').update(keyMaterial).digest('hex');

      const recapDocRef = this.db.collection('recaps').doc(recapKey);

      // Title for weekly snippet (aggregated): prefer AI title; fallback to plain date range (no generic phrase)
      const weekTitleBase = (() => {
        const startFmt = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endFmt = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${startFmt} - ${endFmt}`;
      })();
      const desiredTitle = aiTitleRaw && aiTitleRaw.length > 0 ? aiTitleRaw : weekTitleBase;
      const weekTitle = desiredTitle;

      const recapPayload = {
        userId,
        type: 'weekly_snippet',
        period: { startDate: start, endDate: end },
        aiGenerated: aiContent,
        title: weekTitle,
        childIdsAggregated: journalData?.summary?.children?.uniqueChildren || [],
        summary: journalData.summary,
        imageMetadata: journalData.imageMetadata || { count: 0, hasImages: false, imageTypes: [] },
        status: 'completed',
        createdAt: new Date(),
        source,
        idempotencyKey: recapKey,
      };

      const writeResult = await this.db.runTransaction(async (tx) => {
        const existing = await tx.get(recapDocRef);
        if (existing.exists) {
          return { alreadyExists: true };
        }
        tx.set(recapDocRef, recapPayload);
        return { alreadyExists: false };
      });

      return {
        success: true,
        id: recapKey,
        alreadyExists: writeResult.alreadyExists,
        userId,
        createdAt: recapPayload.createdAt.toISOString(),
        processingTime: Date.now() - startTime,
        ...recapPayload,
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Send notification when recap is ready
   * @param {string} userId - User ID
   * @param {string} childId - Child ID
   * @param {string} type - Recap type (weekly/monthly/yearly)
   * @param {string} recapId - Generated recap ID
   * @param {string} childName - Child's name (not used in notification text)
   * @private
   */
  async sendRecapNotification(userId, childId, type, recapId, childName) {
    try {
      const typeMap = {
        weekly: 'Weekly',
        monthly: 'Monthly',
        yearly: 'Yearly'
      };
      
      const title = `${typeMap[type]} Recap Ready!`;
      const body = `Your ${type} recap is ready to read. Tap to view!`;
      
      // De-dup: create a deterministic notification doc first; if it exists, skip sending push
      const { FieldValue } = require('firebase-admin/firestore');
      const notifId = `recap_ready_${type}_${userId}_${recapId}`;
      const notifRef = this.db.collection('notifications').doc(notifId);

      try {
        await notifRef.create({
          userId,
          childId,
          type: 'recap_ready',
          recapType: type,
          recapId,
          title,
          body,
          read: false,
          createdAt: FieldValue.serverTimestamp()
        });
      } catch (e) {
        // If already exists, do not send push again
        const code = e?.code;
        if (code === 6 || code === 'already-exists') {
          console.log(`Notification already created for ${type} recap ${recapId}; skipping push.`);
          return;
        }
        // For other errors, log and bail to avoid potential duplicate pushes
        console.error(`Failed to create notification record for ${type} recap ${recapId}:`, e);
        return;
      }

      // Only send push if we successfully created the notification record
      await this.notificationService.sendPushNotification(userId, {
        title,
        body,
        data: {
          type: 'recap_ready',
          recapType: type,
          recapId,
          childId,
          childName
        }
      });
      
      console.log(`Notification sent for ${type} recap: ${recapId}`);
    } catch (error) {
      console.error(`Failed to send notification for ${type} recap:`, error);
    }
  }
}

module.exports = { AutomatedRecapService };
