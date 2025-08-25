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
      
      const weekStart = weekRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const weekEnd = weekRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const easyTitle = `${journalData.childName}'s Week ${weekStart} - ${weekEnd}`;
      
      const recap = {
        userId,
        childId,
        type: 'weekly',
        title: easyTitle,
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
      
      const monthName = monthRange.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const easyTitle = `${journalData.childName}'s ${monthName}`;
      
      const recap = {
        userId,
        childId,
        type: 'monthly',
        title: easyTitle,
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
      
      const year = yearRange.start.getFullYear();
      const easyTitle = `${journalData.childName}'s ${year} Year in Review`;
      
      const recap = {
        userId,
        childId,
        type: 'yearly',
        title: easyTitle,
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
    const recapData = {
      userId,
      childId,
      type,
      period: {
        startDate: dateRange.start,
        endDate: dateRange.end
      },
      aiGenerated: aiResponse,
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
      
      // Also save to notifications collection
      const { FieldValue } = require('firebase-admin/firestore');
      await this.db.collection('notifications').add({
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
      
      console.log(`Notification sent for ${type} recap: ${recapId}`);
    } catch (error) {
      console.error(`Failed to send notification for ${type} recap:`, error);
    }
  }
}

module.exports = { AutomatedRecapService };
