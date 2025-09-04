const OpenAI = require('openai');
const functions = require('firebase-functions');

class OpenAIService {
  constructor() {
    this.openai_instance = null;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.maxTokens = parseInt(process.env.MAX_TOKENS, 10) || 2000;
    this.temperature = parseFloat(process.env.TEMPERATURE) || 0.7;
    this.frequencyPenalty = parseFloat(process.env.FREQUENCY_PENALTY) || 0.2;
    this.presencePenalty = parseFloat(process.env.PRESENCE_PENALTY) || 0.1;
  }

  /**
   * Generate a concise recap title from journal content.
   * Returns single-line string; caller enforces 85-char max and fallbacks.
   */
  async generateRecapTitle(journalData, type, dateRange = {}) {
    try {
      const prompt = this.buildTitlePrompt(journalData, type, dateRange);
      const openai = this.getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You write short, clear, human-friendly recap titles. Keep titles punchy and warm. No emojis. No quotes. One line only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 32,
        temperature: Math.min(this.temperature, 0.7),
      });

      const raw = (response.choices?.[0]?.message?.content || '').trim();
      const firstLine = raw.split('\n')[0].trim();
      const unquoted = firstLine.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();
      return unquoted;
    } catch (error) {
      console.error('Error generating recap title:', error);
      return '';
    }
  }

  /** Build a targeted prompt asking only for a concise title */
  buildTitlePrompt(data, type, dateRange = {}) {
    const childName = data?.childName || 'Your child';
    const childAge = data?.childAge ? ` (${data.childAge})` : '';
    const start = dateRange?.start instanceof Date ? dateRange.start : undefined;
    const end = dateRange?.end instanceof Date ? dateRange.end : undefined;
    const periodText = (() => {
      try {
        if (type === 'yearly' && start) return `${start.getFullYear()}`;
        if ((type === 'weekly' || type === 'weekly_snippet') && start && end) {
          const s = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const e = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return `${s} - ${e}`;
        }
        if (type === 'monthly' && start) return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } catch {}
      return '';
    })();

    const sampleMoments = (() => {
      try {
        const daily = data?.dailyEntries || {};
        const values = Object.values(daily).filter(Boolean).slice(0, 2);
        if (values.length) return `Highlights: ${values.join(' | ').slice(0, 180)}`;
      } catch {}
      return '';
    })();

    const typeLabel = type === 'weekly_snippet' ? 'Weekly Highlights' : type.charAt(0).toUpperCase() + type.slice(1);

    return [
      `${childName}${childAge} — ${typeLabel} ${periodText}`.trim(),
      sampleMoments,
      '',
      'Write ONLY a short, punchy, human title that fits within 85 characters.',
      'No quotes, no emojis, no extra lines.'
    ].filter(Boolean).join('\n');
  }

  getOpenAIClient() {
    if (!this.openai_instance) {
      // Use ONLY Firebase functions config (never .env)
      let apiKey = null;
      
      try {
        if (functions.config && functions.config().openai && functions.config().openai.key) {
          apiKey = functions.config().openai.key;
          console.log('Using OpenAI key exclusively from Firebase functions config');
        } else {
          console.error('OpenAI key not found in Firebase functions config');
          console.error('Available config:', functions.config ? Object.keys(functions.config()) : 'functions.config unavailable');
          throw new Error('OpenAI API key must be configured via Firebase functions:config:set');
        }
      } catch (error) {
        console.error('Error accessing Firebase functions config:', error.message);
        throw new Error('Firebase functions config required for OpenAI API key');
      }
      
      this.openai_instance = new OpenAI({ apiKey });
      console.log('OpenAI client initialized with Firebase secrets');
    }
    return this.openai_instance;
  }

  /**
   * Generate recap content using OpenAI by analyzing journal text
   * @param {Object} journalData - Aggregated journal data
   * @param {string} type - Recap type (weekly/monthly/yearly)
   * @returns {Promise<Object>} Generated recap content
   */
  async generateRecap(journalData, type) {
    try {
      const prompt = this.buildPrompt(journalData, type);
      
      const openai = this.getOpenAIClient();
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a warm, loving parent creating ${type} recaps for a baby journal. Analyze journal entries and write engaging summaries that capture special moments, milestones, and the emotional journey of parenthood. Focus on authentic, personal storytelling.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const content = response.choices[0].message.content;
      return this.parseGeneratedContent(content);
    } catch (error) {
      console.error('Error generating recap:', error);
      throw new Error(`Failed to generate recap: ${error.message}`);
    }
  }

  /**
   * Build prompt for OpenAI using standardized templates from RECAP_STRUCTURE.md
   * @param {Object} data - Aggregated journal data with entries
   * @param {string} type - Recap type (weekly/monthly/yearly)
   * @returns {string} Constructed prompt for AI generation
   */
  buildPrompt(data, type) {
    const { childName, childAge, dailyEntries, totalEntries } = data;
    
    if (totalEntries === 0) {
      return this.buildEmptyPrompt(type, childName, childAge);
    }

    const childInfo = childAge ? `${childName} (${childAge})` : childName;

    switch (type) {
      case 'weekly':
        return this.buildWeeklyPrompt(childInfo, dailyEntries);
      case 'monthly':
        return this.buildMonthlyPrompt(childInfo, dailyEntries);
      case 'yearly':
        return this.buildYearlyPrompt(childInfo, dailyEntries);
      default:
        return this.buildWeeklyPrompt(childInfo, dailyEntries);
    }
  }

  /**
   * Build weekly recap prompt using standardized template
   * @param {string} childInfo - Child name and age
   * @param {Object} dailyEntries - Daily entries object
   * @returns {string} Weekly prompt
   */
  buildWeeklyPrompt(childInfo, dailyEntries) {
    const prompt = `You are a warm, loving parent writing a weekly recap for ${childInfo}. 

Write a single 4-6 sentence paragraph that captures the week's essence. Use a warm, light, playful tone. Focus on the most meaningful moments, not every detail.

Weekly entries:
Sunday: ${dailyEntries.sunday || 'No entries'}
Monday: ${dailyEntries.monday || 'No entries'}
Tuesday: ${dailyEntries.tuesday || 'No entries'}
Wednesday: ${dailyEntries.wednesday || 'No entries'}
Thursday: ${dailyEntries.thursday || 'No entries'}
Friday: ${dailyEntries.friday || 'No entries'}
Saturday: ${dailyEntries.saturday || 'No entries'}

Requirements:
- 4-6 sentences total
- Warm, personal parent voice
- Easy to scan and read
- Focus on the most special moments
- If no entries, write a gentle note about the quiet week

Output just the paragraph text, no JSON or formatting.`;

    return prompt;
  }

  /**
   * Build monthly recap prompt using standardized template
   * @param {string} childInfo - Child name and age
   * @param {Object} weeklyEntries - Weekly entries object
   * @returns {string} Monthly prompt
   */
  buildMonthlyPrompt(childInfo, weeklyEntries) {
    const prompt = `You are a warm, loving parent writing a monthly recap for ${childInfo}. 

Write a single 4-6 sentence paragraph that captures the month's essence. Use a warm, light, playful tone. Focus on growth, special moments, and the journey of this month.

Monthly entries:
Week 1: ${weeklyEntries.week1 || 'No entries'}
Week 2: ${weeklyEntries.week2 || 'No entries'}
Week 3: ${weeklyEntries.week3 || 'No entries'}
Week 4: ${weeklyEntries.week4 || 'No entries'}

Requirements:
- 4-6 sentences total
- Warm, personal parent voice
- Easy to scan and read
- Focus on growth and special moments
- If no entries, write a gentle note about the quiet month

Output just the paragraph text, no JSON or formatting.`;

    return prompt;
  }

  /**
   * Build yearly recap prompt using standardized template
   * @param {string} childInfo - Child name and age
   * @param {Object} monthlyEntries - Monthly entries object
   * @returns {string} Yearly prompt
   */
  buildYearlyPrompt(childInfo, monthlyEntries) {
    const prompt = `You are a warm, loving parent writing a yearly recap for ${childInfo}. 

Write a single 4-6 sentence paragraph that captures the year's essence. Use a warm, light, playful tone. Focus on the incredible journey of growth, the most meaningful moments, and how much has changed.

Yearly entries:
January: ${monthlyEntries.january || 'No entries'}
February: ${monthlyEntries.february || 'No entries'}
March: ${monthlyEntries.march || 'No entries'}
April: ${monthlyEntries.april || 'No entries'}
May: ${monthlyEntries.may || 'No entries'}
June: ${monthlyEntries.june || 'No entries'}
July: ${monthlyEntries.july || 'No entries'}
August: ${monthlyEntries.august || 'No entries'}
September: ${monthlyEntries.september || 'No entries'}
October: ${monthlyEntries.october || 'No entries'}
November: ${monthlyEntries.november || 'No entries'}
December: ${monthlyEntries.december || 'No entries'}

Requirements:
- 4-6 sentences total
- Warm, personal parent voice
- Easy to scan and read
- Focus on growth and the incredible journey
- If no entries, write a gentle note about the quiet year

Output just the paragraph text, no JSON or formatting.`;

    return prompt;
  }

  /**
   * Build prompt for when no entries are found
   * @param {string} type - Recap type
   * @param {string} childName - Child name
   * @param {string} childAge - Child age
   * @returns {string} Empty prompt
   */
  buildEmptyPrompt(type, childName, childAge) {
    const childInfo = childAge ? `${childName} (${childAge})` : childName;
    const periodText = type === 'weekly' ? 'week' : type === 'monthly' ? 'month' : 'year';
    
    return `Write a gentle 2-3 sentence note for ${childInfo} about a quiet ${periodText} with no journal entries. Use a warm, loving parent voice. Focus on the peaceful moments and looking forward to capturing memories next ${periodText}.`;
  }

  /**
   * Parse the generated content into structured format
   * @param {string} content - Raw AI generated content
   * @returns {Object} Structured recap content matching new format
   */
  parseGeneratedContent(content) {
    if (!content || content.trim() === '') {
      return {
        recapText: 'This was a quiet period with no journal entries. Looking forward to capturing more memories next time.',
        tone: 'gentle'
      };
    }

    // Clean and normalize the content
    const cleanContent = content.trim();
    
    return {
      recapText: cleanContent,
      tone: 'warm'
    };
  }
}

module.exports = OpenAIService;
