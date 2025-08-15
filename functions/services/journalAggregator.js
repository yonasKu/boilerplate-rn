const { db, logFirestoreError } = require('../firebaseAdmin');
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } = require('date-fns');

class JournalAggregator {
  constructor() {
    this.db = db;
    this.maxEntriesPerQuery = parseInt(process.env.MAX_ENTRIES_PER_QUERY) || 1000;
    this.defaultTimeout = 30000; // 30 seconds
  }

  /**
   * Fetch journal entries for recap generation with enhanced error handling
   * @param {Object} params - Query parameters
   * @param {string} params.userId - User ID
   * @param {string} params.childId - Child ID
   * @param {string} params.type - Recap type (weekly/monthly/yearly)
   * @param {Date} params.startDate - Period start date
   * @param {Date} params.endDate - Period end date
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Aggregated journal data
   */
  async aggregateJournalEntries({ userId, childId, type, startDate, endDate }, options = {}) {
    const startTime = Date.now();
    const operationId = `aggregate_${userId}_${childId}_${type}_${Date.now()}`;
    
    try {
      console.log(`[${operationId}] Starting journal aggregation`, {
        userId,
        childId,
        type,
        dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
        maxEntries: this.maxEntriesPerQuery
      });

      // Validate inputs
      this.validateInputs({ userId, childId, type, startDate, endDate });

      // Build optimized Firestore query
      const query = this.buildOptimizedQuery({ userId, childId, startDate, endDate });
      
      // Execute query with timeout
      const snapshot = await this.executeWithTimeout(query.get(), this.defaultTimeout);
      
      if (snapshot.empty) {
        console.log(`[${operationId}] No journal entries found`);
        return this.createEmptyResult(startDate, endDate);
      }

      // Process entries with error handling
      const processedEntries = this.processEntries(snapshot, operationId);
      
      const summary = {
        period: type,
        totalEntries: processedEntries.length,
        dateRange: {
          start: startDate,
          end: endDate
        },
        milestones: this.analyzeMilestones(processedEntries),
        media: this.analyzeMediaContent(processedEntries),
        favoritedEntries: processedEntries.filter(e => e.isFavorited).length,
        keyMoments: processedEntries.filter(e => e.isFavorited || e.isMilestone)
          .slice(0, 10)
          .map(e => ({
            content: e.content.substring(0, 100) + (e.content.length > 100 ? '...' : ''),
            date: e.date,
            isMilestone: e.isMilestone,
            isFavorited: e.isFavorited,
            mediaCount: e.mediaCount
          })),
        children: this.analyzeChildren(processedEntries)
      };

      console.log(`[${operationId}] Journal aggregation completed successfully`, {
        totalEntries: processedEntries.length,
        processingTime: Date.now() - startTime,
        summary: {
          totalEntries: summary.totalEntries,
          milestones: summary.milestones.totalMilestones,
          favorites: summary.favoritedEntries,
          mediaEntries: summary.media.totalMediaEntries
        }
      });

      return {
        entries: processedEntries,
        totalEntries: processedEntries.length,
        summary,
        dateRange: {
          start: startDate,
          end: endDate
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[${operationId}] Journal aggregation failed`, {
        error: error.message,
        processingTime,
        userId: userId,
        childId: childId,
        type: type
      });
      
      logFirestoreError('aggregateJournalEntries', error, {
        userId: userId,
        childId: childId,
        type: type,
        dateRange: `${startDate} - ${endDate}`,
        processingTime
      });

      // Return safe fallback data
      return {
        entries: [],
        totalEntries: 0,
        summary: {
          period: type,
          totalEntries: 0,
          dateRange: {
            start: startDate,
            end: endDate
          },
          milestones: { milestones: [], totalMilestones: 0, recentMilestones: [], milestoneEntries: [] },
          media: { totalMediaEntries: 0, totalMediaCount: 0, mediaEntries: [] },
          favoritedEntries: 0,
          keyMoments: [],
          children: { uniqueChildren: [], entriesPerChild: {} }
        },
        dateRange: {
          start: startDate,
          end: endDate
        }
      };
    }
  }

  /**
   * Validate input parameters
   * @param {Object} params - Parameters to validate
   */
  validateInputs({ userId, childId, type, startDate, endDate }) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid userId: must be a non-empty string');
    }
    if (!childId || typeof childId !== 'string') {
      throw new Error('Invalid childId: must be a non-empty string');
    }
    if (!['weekly', 'monthly', 'yearly'].includes(type)) {
      throw new Error('Invalid type: must be weekly, monthly, or yearly');
    }
    if (!startDate || !(startDate instanceof Date)) {
      throw new Error('Invalid startDate: must be a Date object');
    }
    if (!endDate || !(endDate instanceof Date)) {
      throw new Error('Invalid endDate: must be a Date object');
    }
    if (startDate >= endDate) {
      throw new Error('Invalid date range: startDate must be before endDate');
    }
  }

  /**
   * Build optimized Firestore query with proper indexing
   * @param {Object} params - Query parameters
   * @returns {Object} Optimized Firestore query
   */
  buildOptimizedQuery({ userId, childId, startDate, endDate }) {
    let query = this.db.collection('journalEntries');
    
    // Use composite indexes for better performance
    query = query.where('userId', '==', userId)
                .where('childIds', 'array-contains', childId)
                .where('createdAt', '>=', startDate)
                .where('createdAt', '<=', endDate)
                .orderBy('createdAt', 'desc')
                .limit(this.maxEntriesPerQuery);

    return query;
  }

  /**
   * Execute promise with timeout
   * @param {Promise} promise - Promise to execute
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise} Result or timeout error
   */
  async executeWithTimeout(promise, timeoutMs) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Process Firestore snapshot into structured data
   * @param {Object} snapshot - Firestore query snapshot
   * @param {string} operationId - Operation ID for logging
   * @returns {Object} Processed journal data
   */
  processEntries(snapshot, operationId) {
    const entries = [];
    snapshot.forEach((doc, index) => {
      try {
        const data = doc.data();
        
        // Validate required fields
        if (!data.userId || !data.childIds || !data.createdAt) {
          console.error(`[${operationId}] Document ${doc.id}: missing required fields`);
          return;
        }

        const entry = {
          id: doc.id,
          content: data.text || 'No content provided',
          date: data.createdAt?.toDate?.() || new Date(),
          isFavorited: data.isFavorited || false,
          isMilestone: data.isMilestone || false,
          mediaCount: data.media?.length || 0,
          childIds: data.childIds || [],
          childAgeAtEntry: data.childAgeAtEntry || ''
        };
        
        entries.push(entry);
      } catch (error) {
        console.error(`[${operationId}] Document ${doc.id}: ${error.message}`);
      }
    });

    return entries;
  }

  /**
   * Analyze milestone achievements from entries
   * @param {Array} entries - Array of journal entries
   * @returns {Object} Milestone analysis results
   */
  analyzeMilestones(entries) {
    const milestones = entries.filter(entry => entry.isMilestone);
    
    return {
      milestones,
      totalMilestones: milestones.length,
      recentMilestones: milestones.slice(-5),
      milestoneEntries: milestones.map(entry => ({
        id: entry.id,
        content: entry.content,
        date: entry.date,
        mediaCount: entry.mediaCount
      }))
    };
  }

  /**
   * Generate media summary from entries
   * @param {Array} entries - Array of journal entries
   * @returns {Object} Media analysis results
   */
  analyzeMediaContent(entries) {
    const mediaEntries = entries.filter(entry => entry.mediaCount > 0);
    
    return {
      totalMediaEntries: mediaEntries.length,
      totalMediaCount: entries.reduce((sum, entry) => sum + (entry.mediaCount || 0), 0),
      mediaEntries: mediaEntries.map(entry => ({
        id: entry.id,
        content: entry.content,
        date: entry.date,
        mediaCount: entry.mediaCount
      }))
    };
  }

  /**
   * Analyze children mentioned in entries
   * @param {Array} entries - Array of journal entries
   * @returns {Object} Children analysis results
   */
  analyzeChildren(entries) {
    const childrenMap = {};
    
    entries.forEach(entry => {
      if (entry.childIds && Array.isArray(entry.childIds)) {
        entry.childIds.forEach(childId => {
          if (!childrenMap[childId]) {
            childrenMap[childId] = 0;
          }
          childrenMap[childId]++;
        });
      }
    });

    return {
      uniqueChildren: Object.keys(childrenMap),
      entriesPerChild: childrenMap,
      totalChildren: Object.keys(childrenMap).length
    };
  }

  /**
   * Create empty result for when no entries are found
   * @param {Date} startDate - Period start date
   * @param {Date} endDate - Period end date
   * @returns {Object} Empty result structure
   */
  createEmptyResult(startDate, endDate) {
    return {
      entries: [],
      totalEntries: 0,
      summary: {
        period: 'weekly',
        totalEntries: 0,
        dateRange: {
          start: startDate,
          end: endDate
        },
        milestones: { milestones: [], totalMilestones: 0, recentMilestones: [], milestoneEntries: [] },
        media: { totalMediaEntries: 0, totalMediaCount: 0, mediaEntries: [] },
        favoritedEntries: 0,
        keyMoments: [],
        children: { uniqueChildren: [], entriesPerChild: {} }
      },
      dateRange: {
        start: startDate,
        end: endDate
      }
    };
  }

  /**
   * Get date range for different recap types
   * @param {string} type - Recap type (weekly/monthly/yearly)
   * @param {Date} referenceDate - Reference date for calculation
   * @returns {Object} Date range object with start and end dates
   */
  getDateRange(type, referenceDate = new Date()) {
    switch (type) {
      case 'weekly':
        return {
          start: startOfWeek(referenceDate, { weekStartsOn: 0 }),
          end: endOfWeek(referenceDate, { weekStartsOn: 0 })
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
        const now = new Date();
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: now
        };
    }
  }
}

module.exports = JournalAggregator;
