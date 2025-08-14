const { db } = require('../firebaseAdmin');
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } = require('date-fns');

class JournalAggregator {
  constructor() {
    this.db = db;
  }

  /**
   * Fetch journal entries for recap generation
   * @param {Object} params - Query parameters
   * @param {string} params.userId - User ID
   * @param {string} params.childId - Child ID
   * @param {string} params.type - Recap type (weekly/monthly/yearly)
   * @param {Date} params.startDate - Period start date
   * @param {Date} params.endDate - Period end date
   * @returns {Promise<Object>} Aggregated journal data
   */
  async aggregateJournalEntries({ userId, childId, type, startDate, endDate }) {
    try {
      console.log(`Aggregating journal entries for user ${userId}, child ${childId}, type ${type}`);

      // Build Firestore query
      let query = this.db.collection('journalEntries')
        .where('userId', '==', userId)
        .where('childIds', 'array-contains', childId)
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .orderBy('createdAt', 'desc');

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        console.log('No journal entries found for this period');
        return {
          entries: [],
          totalEntries: 0,
          moodSummary: {},
          activitySummary: {},
          photos: [],
          keyMoments: [],
          dateRange: { start: startDate, end: endDate }
        };
      }

      const entries = [];
      const photos = [];
      const keyMoments = [];

      snapshot.forEach(doc => {
        const entry = doc.data();
        const processedEntry = {
          id: doc.id,
          ...entry,
          createdAt: entry.createdAt.toDate(),
          updatedAt: entry.updatedAt.toDate()
        };
        
        entries.push(processedEntry);

        // Collect photos
        if (entry.photos && Array.isArray(entry.photos)) {
          photos.push(...entry.photos);
        }

        // Extract key moments from content
        if (entry.content && entry.content.length > 50) {
          keyMoments.push({
            date: entry.createdAt.toDate(),
            summary: entry.content.substring(0, 150) + (entry.content.length > 150 ? '...' : ''),
            photos: entry.photos || [],
            fullContent: entry.content
          });
        }
      });

      return {
        entries,
        totalEntries: entries.length,
        photos: this.selectBestPhotos(photos, 5),
        keyMoments: keyMoments.slice(0, 5),
        dateRange: { start: startDate, end: endDate }
      };
    } catch (error) {
      console.error('Error aggregating journal entries:', error);
      throw new Error(`Failed to aggregate journal entries: ${error.message}`);
    }
  }

  /**
   * Select best photos for recap highlights
   * @param {Array} photos - Array of photo URLs
   * @param {number} maxPhotos - Maximum photos to select
   * @returns {Array} Selected photo URLs
   */
  selectBestPhotos(photos, maxPhotos) {
    if (!photos || photos.length === 0) return [];
    
    // For now, return first N photos
    // TODO: Implement AI-based photo selection based on quality, relevance, diversity
    return photos.slice(0, maxPhotos);
  }

  /**
   * Calculate date ranges for different recap types
   * @param {string} type - Recap type
   * @param {Date} referenceDate - Reference date
   * @returns {Object} Date range object
   */
  calculateDateRange(type, referenceDate = new Date()) {
    switch (type) {
      case 'weekly':
        return {
          start: startOfWeek(referenceDate, { weekStartsOn: 1 }),
          end: endOfWeek(referenceDate, { weekStartsOn: 1 })
        };
      case 'monthly':
        return {
          start: startOfMonth(referenceDate),
          end: endOfMonth(referenceDate)
        };
      case 'yearly':
        return {
          start: startOfYear(referenceDate),
          end: endOfYear(referenceDate)
        };
      default:
        throw new Error(`Invalid recap type: ${type}`);
    }
  }
}

module.exports = JournalAggregator;
