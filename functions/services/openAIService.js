const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    this.maxTokens = parseInt(process.env.MAX_TOKENS) || 2000;
    this.temperature = parseFloat(process.env.TEMPERATURE) || 0.7;
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
      
      const response = await this.openai.chat.completions.create({
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
   * Build prompt for OpenAI by analyzing actual journal data structure
   * @param {Object} data - Aggregated journal data with entries
   * @param {string} type - Recap type (weekly/monthly/yearly)
   * @returns {string} Constructed prompt for AI generation
   */
  buildPrompt(data, type) {
    const entryCount = data.totalEntries;
    const entries = data.entries;
    
    if (entryCount === 0) {
      return `No journal entries found for this ${type} period.`;
    }

    let prompt = `Create a warm, engaging ${type} recap based on the following journal entries. Focus on the emotional journey, special moments, and any milestones or developments.\n\n`;
    
    prompt += `Period: ${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}\n`;
    prompt += `Total entries: ${entryCount}\n`;
    prompt += `Milestone entries: ${data.summary.milestones.totalMilestones}\n`;
    prompt += `Favorited entries: ${data.summary.favoritedEntries}\n`;
    prompt += `Media entries: ${data.summary.media.totalMediaEntries}\n\n`;
    
    if (entries.length > 0) {
      prompt += "Journal entries:\n";
      entries.slice(0, 10).forEach((entry, index) => {
        prompt += `${index + 1}. ${entry.date?.toLocaleDateString() || 'Unknown date'}: ${entry.content.substring(0, 200) || 'No content'}${entry.content.length > 200 ? '...' : ''}\n`;
        if (entry.isMilestone) prompt += `   🏆 Milestone entry\n`;
        if (entry.isFavorited) prompt += `   ❤️ Favorited entry\n`;
        if (entry.mediaCount > 0) prompt += `   📸 ${entry.mediaCount} media items\n`;
        if (entry.childAgeAtEntry) prompt += `   👶 ${entry.childAgeAtEntry}\n`;
        prompt += "\n";
      });
    }

    if (entries.length > 10) {
      prompt += `... and ${entries.length - 10} more entries\n\n`;
    }

    prompt += `\n**Your Task:**
1. Read each journal entry carefully and identify the emotional journey
2. Highlight any milestones mentioned (look for isMilestone: true entries)
3. Note special moments captured in media entries
4. Focus on growth and development observations
5. Create a warm, personal summary as if written by a loving parent

**Requirements:**
- Write in a warm, personal, parent voice
- Include specific details from the actual journal content
- Highlight developmental milestones and special moments
- Capture emotional connections and growth
- Keep it concise but meaningful (2-3 paragraphs)
- Structure as valid JSON with the following format:

**Output format:**
{
  "title": "A meaningful title based on the content",
  "summary": "Overall summary paragraph capturing the period's essence",
  "keyMoments": [
    {
      "moment": "Specific memorable moment from the entries",
      "significance": "Why this was special based on the context"
    }
  ],
  "emotionalTone": "positive|challenging|neutral",
  "highlights": ["Array of key highlights"],
  "insights": ["Array of insights about growth/development"]
}`;
    
    return prompt;
  }

  /**
   * Parse the generated content into structured format
   * @param {string} content - Raw AI generated content
   * @returns {Object} Structured recap content
   */
  parseGeneratedContent(content) {
    if (!content || content.trim() === '') {
      return {
        summary: 'No content generated',
        highlights: [],
        insights: [],
        rawContent: content,
        title: 'Weekly Recap',
        emotionalTone: 'neutral',
        title: titleMatch ? titleMatch[1] : `${type.charAt(0).toUpperCase() + type.slice(1)} Recap`,
        summary: summaryMatch ? summaryMatch[1] : content.substring(0, 200) + '...',
        keyMoments: []
      };
    }
  }
}

module.exports = OpenAIService;
