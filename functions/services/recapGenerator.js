const JournalAggregator = require('./journalAggregator');
const OpenAIService = require('./openAIService');

class AutomatedRecapService {
  constructor() {
    this.journalAggregator = new JournalAggregator();
    this.openAIService = new OpenAIService();
    this.db = require('../firebaseAdmin').db;
  }

  /**
   * Generates a weekly recap using AI analysis
   */
  async generateWeeklyRecap(userId, childId, weekRange) {
    try {
      const journalData = await this.journalAggregator.aggregateJournalEntries({
        userId,
        childId,
        type: 'weekly',
        startDate: weekRange.start,
        endDate: weekRange.end
      });

      if (journalData.totalEntries < 3) {
        console.log(`Skipping weekly recap for child ${childId}: not enough entries.`);
        return null;
      }

      const aiResponse = await this.openAIService.generateRecap(journalData, 'weekly');
      return await this.saveRecap(userId, childId, 'weekly', weekRange, aiResponse);
    } catch (error) {
      console.error('Error generating weekly recap:', error);
      throw error;
    }
  }

  /**
   * Generates a monthly recap using AI analysis
   */
  async generateMonthlyRecap(userId, childId, monthRange) {
    try {
      const journalData = await this.journalAggregator.aggregateJournalEntries({
        userId,
        childId,
        type: 'monthly',
        startDate: monthRange.start,
        endDate: monthRange.end
      });

      if (journalData.totalEntries < 5) {
        console.log(`Skipping monthly recap for child ${childId}: not enough entries.`);
        return null;
      }

      const aiResponse = await this.openAIService.generateRecap(journalData, 'monthly');
      return await this.saveRecap(userId, childId, 'monthly', monthRange, aiResponse);
    } catch (error) {
      console.error('Error generating monthly recap:', error);
      throw error;
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
