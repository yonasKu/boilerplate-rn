const { db, logFirestoreError } = require('../firebaseAdmin');
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } = require('date-fns');

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

      // Get child details for personalization
      let childDetails = { name: 'Your child', age: '' };
      try {
        childDetails = await this.getChildDetails(userId, childId);
      } catch (error) {
        console.warn('Failed to fetch child details, using defaults:', error.message);
      }

      // Build optimized Firestore query
      const query = this.buildOptimizedQuery({ userId, childId, startDate, endDate });
      
      // Execute query with timeout
      const snapshot = await this.executeWithTimeout(query.get(), this.defaultTimeout);
      
      if (snapshot.empty) {
        console.log(`[${operationId}] No journal entries found`);
        return this.createEmptyResult(startDate, endDate, childDetails);
      }

      // Process entries with error handling
      const processedEntries = this.processEntries(snapshot, operationId);
      
      // Format entries based on recap type
      const formattedEntries = this.formatEntriesByType(processedEntries, type, startDate, endDate);
      
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

      const mediaAnalysis = this.analyzeMediaContent(processedEntries);
      
      return {
        childName: childDetails.name,
        childAge: childDetails.age,
        dailyEntries: formattedEntries,
        totalEntries: processedEntries.length,
        summary,
        imageMetadata: mediaAnalysis.imageMetadata,
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
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(type)) {
      throw new Error('Invalid type: must be daily, weekly, monthly, or yearly');
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
          imageMetadata: this.extractImageMetadata(data.media || []),
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
   * Extract image metadata from media array with limits
   * @param {Array} media - Media array from journal entry
   * @returns {Object} Image metadata for frontend display
   */
  extractImageMetadata(media) {
    const MAX_IMAGES_PER_ENTRY = 3; // Limit to 3 images per journal entry
    
    if (!media || !Array.isArray(media)) {
      return {
        count: 0,
        hasImages: false,
        imageTypes: [],
        totalSize: 0,
        images: []
      };
    }

    const images = media.filter(item => item.type === 'image').slice(0, MAX_IMAGES_PER_ENTRY);
    
    return {
      count: images.length,
      hasImages: images.length > 0,
      imageTypes: [...new Set(images.map(img => img.type))],
      totalSize: images.reduce((sum, img) => sum + (img.size || 0), 0),
      images: images.map(img => ({
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        type: img.type
      }))
    };
  }

  /**
   * Extract image URLs only from entries within the recap date range
   * @param {Array} entries - Journal entries filtered by date range
   * @param {string} type - Recap type (weekly/monthly/yearly)
   * @returns {Array} Array of image URLs from date-filtered entries only
   */
  extractImagesFromDateRange(entries, type) {
    if (!entries || !Array.isArray(entries)) {
      return [];
    }
    
    // Dynamic limits based on recap type
    const limits = {
      weekly: 10,
      monthly: 15,
      yearly: 25
    };
    
    const maxImages = limits[type] || 3;
    
    return entries
      .filter(entry => entry.imageMetadata && entry.imageMetadata.hasImages)
      .flatMap(entry => entry.imageMetadata.images || [])
      .filter(image => image && image.url)
      .map(image => image.url)
      .slice(0, maxImages); // Limit based on recap type
  }

  /**
   * Generate media summary from entries filtered by recap date range
   * @param {Array} entries - Array of journal entries (already filtered by date)
   * @param {string} type - Recap type (weekly/monthly/yearly)
   * @returns {Object} Media analysis results with image URLs from date-filtered entries only
   */
  analyzeMediaContent(entries, type = 'weekly') {
    const mediaEntries = entries.filter(entry => entry.mediaCount > 0);
    
    // Extract image URLs ONLY from entries within the recap date range
    const highlightPhotos = this.extractImagesFromDateRange(entries, type);
    
    return {
      totalMediaEntries: mediaEntries.length,
      totalMediaCount: entries.reduce((sum, entry) => sum + (entry.mediaCount || 0), 0),
      totalImages: highlightPhotos.length,
      hasImages: highlightPhotos.length > 0,
      highlightPhotos, // Image URLs from date-filtered entries only
      imageMetadata: {
        count: highlightPhotos.length,
        hasImages: highlightPhotos.length > 0,
        imageTypes: ['image'] // Simplified since we're extracting actual URLs
      },
      mediaEntries: mediaEntries.map(entry => ({
        id: entry.id,
        content: entry.content,
        date: entry.date,
        mediaCount: entry.mediaCount,
        imageMetadata: entry.imageMetadata
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
  createEmptyResult(startDate, endDate, childDetails = null) {
    return {
      childName: childDetails?.name || 'Child',
      childAge: childDetails?.age || '',
      dailyEntries: this.getEmptyDailyEntries(),
      totalEntries: 0,
      summary: {
        period: 'weekly',
        totalEntries: 0,
        dateRange: {
          start: startDate,
          end: endDate
        },
        milestones: { milestones: [], totalMilestones: 0, recentMilestones: [], milestoneEntries: [] },
        media: { totalMediaEntries: 0, totalMediaCount: 0, mediaEntries: [], imageMetadata: { count: 0, hasImages: false, imageTypes: [] } },
        favoritedEntries: 0,
        keyMoments: [],
        children: { uniqueChildren: [], entriesPerChild: {} }
      },
      dateRange: {
        start: startDate,
        end: endDate
      },
      imageMetadata: { count: 0, hasImages: false, imageTypes: [] }
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

  /**
   * Fetch child details for personalization
   * @param {string} userId - User ID
   * @param {string} childId - Child ID
   * @returns {Promise<Object>} Child details with name and age
   */
  async getChildDetails(userId, childId) {
    try {
      const childDoc = await this.db.collection('children').doc(childId).get();
      
      if (!childDoc.exists) {
        throw new Error(`Child ${childId} not found`);
      }

      const childData = childDoc.data();
      
      // Verify this child belongs to the user
      if (childData.parentId !== userId) {
        throw new Error(`Child ${childId} does not belong to user ${userId}`);
      }

      const age = this.calculateAgeString(childData.dateOfBirth || childData.birthDate);
      
      return {
        name: childData.name || 'Your child',
        age: age
      };
    } catch (error) {
      console.error('Error fetching child details:', error);
      return {
        name: 'Your child',
        age: ''
      };
    }
  }

  /**
   * Calculate human-readable age string from date of birth
   * @param {Date} dateOfBirth - Child's date of birth
   * @returns {string} Age string (e.g., "6 months old")
   */
  calculateAgeString(dateOfBirth) {
    if (!dateOfBirth) return '';
    
    let birthDate;
    
    // Handle Firestore Timestamp
    if (dateOfBirth && typeof dateOfBirth.toDate === 'function') {
      birthDate = dateOfBirth.toDate();
    }
    // Handle string dates
    else if (typeof dateOfBirth === 'string') {
      birthDate = new Date(dateOfBirth);
    }
    // Handle Date objects
    else {
      birthDate = new Date(dateOfBirth);
    }
    
    // Validate the date
    if (isNaN(birthDate.getTime())) {
      console.warn('Invalid date format:', dateOfBirth);
      return '';
    }
    
    const now = new Date();
    
    // Calculate age in months
    const years = now.getFullYear() - birthDate.getFullYear();
    const months = now.getMonth() - birthDate.getMonth();
    const totalMonths = years * 12 + months;
    
    // Calculate days for babies under 1 month
    if (totalMonths < 1) {
      const totalDays = Math.floor((now - birthDate) / (1000 * 60 * 60 * 24));
      if (totalDays < 7) {
        return `${totalDays} day${totalDays !== 1 ? 's' : ''} old`;
      }
      const weeks = Math.floor(totalDays / 7);
      return `${weeks} week${weeks !== 1 ? 's' : ''} old`;
    } else if (totalMonths < 12) {
      return `${totalMonths} month${totalMonths !== 1 ? 's' : ''} old`;
    } else {
      const displayYears = Math.floor(totalMonths / 12);
      const remainingMonths = totalMonths % 12;
      
      if (remainingMonths === 0) {
        return `${displayYears} year${displayYears !== 1 ? 's' : ''} old`;
      } else {
        return `${displayYears} year${displayYears !== 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''} old`;
      }
    }
  }
  formatEntriesByType(entries, type, startDate, endDate) {
    switch (type) {
      case 'weekly':
        return this.formatWeeklyEntries(entries, startDate);
      case 'monthly':
        return this.formatMonthlyEntries(entries, startDate);
      case 'yearly':
        return this.formatYearlyEntries(entries, startDate);
      default:
        return this.formatWeeklyEntries(entries, startDate);
    }
  }

  /**
   * Format entries for weekly recap (Sun→Sat)
   * @param {Array} entries - Journal entries
   * @param {Date} startDate - Week start date
   * @returns {Object} Daily entries object
   */
  formatWeeklyEntries(entries, startDate) {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
    const dailyEntries = {
      sunday: '',
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: ''
    };

    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const dayOfWeek = entryDate.getDay();
      const dayKey = dayMap[dayOfWeek];
      
      if (dailyEntries[dayKey] !== undefined) {
        const entryText = entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : '');
        dailyEntries[dayKey] = dailyEntries[dayKey] 
          ? dailyEntries[dayKey] + ' • ' + entryText 
          : entryText;
      }
    });

    return dailyEntries;
  }

  /**
   * Format entries for monthly recap (Week 1→4)
   * @param {Array} entries - Journal entries
   * @param {Date} startDate - Month start date
   * @returns {Object} Weekly entries object
   */
  formatMonthlyEntries(entries, startDate) {
    const weeklyEntries = {
      week1: '',
      week2: '',
      week3: '',
      week4: ''
    };

    const monthStart = startOfMonth(startDate);
    const monthEnd = endOfMonth(startDate);
    const daysPerWeek = Math.ceil((monthEnd - monthStart) / (1000 * 60 * 60 * 24 * 7));

    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const daysSinceStart = Math.floor((entryDate - monthStart) / (1000 * 60 * 60 * 24));
      const weekNumber = Math.min(Math.floor(daysSinceStart / 7) + 1, 4);
      const weekKey = `week${weekNumber}`;
      
      if (weeklyEntries[weekKey] !== undefined) {
        const entryText = entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : '');
        weeklyEntries[weekKey] = weeklyEntries[weekKey] 
          ? weeklyEntries[weekKey] + ' • ' + entryText 
          : entryText;
      }
    });

    return weeklyEntries;
  }

  /**
   * Format entries for yearly recap (Month 1→12)
   * @param {Array} entries - Journal entries
   * @param {Date} startDate - Year start date
   * @returns {Object} Monthly entries object
   */
  formatYearlyEntries(entries, startDate) {
    const monthlyEntries = {
      january: '', february: '', march: '', april: '', may: '', june: '',
      july: '', august: '', september: '', october: '', november: '', december: ''
    };

    const monthMap = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];

    entries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const monthIndex = entryDate.getMonth();
      const monthKey = monthMap[monthIndex];
      
      if (monthlyEntries[monthKey] !== undefined) {
        const entryText = entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : '');
        monthlyEntries[monthKey] = monthlyEntries[monthKey] 
          ? monthlyEntries[monthKey] + ' • ' + entryText 
          : entryText;
      }
    });

    return monthlyEntries;
  }

  /**
   * Get empty daily entries structure
   * @returns {Object} Empty daily entries
   */
  getEmptyDailyEntries() {
    return {
      sunday: '', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: ''
    };
  }
}

module.exports = JournalAggregator;
