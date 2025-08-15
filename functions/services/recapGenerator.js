const JournalAggregator = require('./journalAggregator');
const OpenAIService = require('./openAIService');

class AutomatedRecapService {
  constructor() {
    this.journalAggregator = new JournalAggregator();
    this.openAIService = new OpenAIService();
    this.db = require('../firebaseAdmin').db;
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

      if (journalData.totalEntries < 3) {
        console.log(`[${operationId}] Insufficient entries for monthly recap: ${journalData.totalEntries}`);
        return {
          success: false,
          message: 'Insufficient entries for recap generation',
          totalEntries: journalData.totalEntries,
          minimumRequired: 3
        };
      }

      const aiContent = await this.openAIService.generateRecap(journalData, 'monthly');
      
      const recap = {
        userId,
        childId,
        type: 'monthly',
        period: {
          start: monthRange.start,
          end: monthRange.end
        },
        summary: aiContent.summary,
        title: aiContent.title,
        highlights: aiContent.highlights,
        insights: aiContent.insights,
        keyMoments: aiContent.keyMoments,
        emotionalTone: aiContent.emotionalTone,
        milestoneSummary: journalData.summary.milestones,
        mediaSummary: journalData.summary.media,
        favoritedEntries: journalData.summary.favoritedEntries,
        totalEntries: journalData.totalEntries,
        generatedAt: new Date(),
        status: 'generated',
        processingTime: Date.now() - startTime
      };

      // Save to Firestore
      const docRef = await this.db.collection('recaps').add(recap);
      console.log(`[${operationId}] Monthly recap generated successfully: ${docRef.id}`);
      
      return {
        success: true,
        id: docRef.id,
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
   * Generates a yearly recap using AI analysis
   */
  async generateYearlyRecap(userId, childId, yearRange) {
    try {
      const journalData = await this.journalAggregator.aggregateJournalEntries({
        userId,
        childId,
        type: 'yearly',
        startDate: yearRange.start,
        endDate: yearRange.end
      });

      if (journalData.totalEntries < 10) {
        console.log(`Skipping yearly recap for child ${childId}: not enough entries.`);
        return null;
      }

      const aiResponse = await this.openAIService.generateRecap(journalData, 'yearly');
      return await this.saveRecap(userId, childId, 'yearly', yearRange, aiResponse);
    } catch (error) {
      console.error('Error generating yearly recap:', error);
      throw error;
    }
  }

  // --- Helper Methods (To be implemented) ---

  async fetchJournalEntries(userId, childId, dateRange) {
    // TODO: Implement Firestore query to get journal entries within the dateRange
    console.log(`Fetching entries for ${childId} from ${dateRange.start} to ${dateRange.end}`);
    return [];
  }

  async callAIProvider(entries, type) {
    // TODO: Implement the call to OpenAI/Gemini to generate the recap content
    console.log(`Calling AI provider for ${type} recap with ${entries.length} entries.`);
    return { title: 'AI Generated Title', summary: 'AI generated summary.', keyMoments: [], sentiment: 'positive' };
  }

  /**
   * Saves generated recap to Firestore
   */
  async saveRecap(userId, childId, type, dateRange, aiResponse) {
    const recapRef = await this.db.collection('recaps').add({
      userId,
      childId,
      type,
      period: {
        startDate: dateRange.start,
        endDate: dateRange.end
      },
      aiGenerated: aiResponse,
      status: 'completed',
      createdAt: new Date(),
      generatedAt: new Date()
    });

    console.log(`Saving ${type} recap ${recapRef.id} for child ${childId}.`);
    return recapRef.id;
  }
}

module.exports = { AutomatedRecapService };
