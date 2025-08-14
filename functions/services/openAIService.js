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
   * Build prompt for OpenAI by analyzing journal text content
   * @param {Object} data - Aggregated journal data with entries
   * @param {string} type - Recap type (weekly/monthly/yearly)
   * @returns {string} Formatted prompt for text analysis
   */
  buildPrompt(data, type) {
    const { entries, totalEntries, photos } = data;
    
    // Format journal entries for AI analysis
    const entriesText = entries.map(entry => 
      `- ${entry.createdAt.toDateString()}: ${entry.content || 'No content provided'}`
    ).join('\n');

    return `Analyze these journal entries and create a ${type} recap:

**Journal Entries (${totalEntries} total):**
${entriesText}

**Available Photos:** ${photos.length} photos attached

**Your Task:**
1. Read each journal entry carefully
2. Identify the emotional tone (happy, tired, excited, challenging moments)
3. Extract specific activities mentioned (feeding, playtime, milestones, etc.)
4. Find memorable moments and achievements
5. Create a warm, personal summary as if written by a parent

**Requirements:**
- Write in a warm, personal, parent voice
- Include specific details found in the text
- Highlight developmental milestones mentioned
- Capture emotional connections and growth
- Keep it concise but meaningful
- Structure as valid JSON

**Output format:**
{
  "title": "A meaningful title based on content",
  "summary": "Overall summary paragraph capturing the period's essence",
  "keyMoments": [
    {
      "moment": "Specific memorable moment from text",
      "significance": "Why this was special based on context"
    }
  ]
}`;
  }

  /**
   * Parse generated content from OpenAI response
   * @param {string} content - Raw content from OpenAI
   * @returns {Object} Parsed content object
   */
  parseGeneratedContent(content) {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Recap`,
        summary: parsed.summary || '',
        keyMoments: parsed.keyMoments || []
      };
    } catch (error) {
      // Fallback to text parsing
      const lines = content.split('\n').filter(line => line.trim());
      
      // Simple text extraction if JSON parsing fails
      const titleMatch = content.match(/"title":\s*"([^"]+)"/);
      const summaryMatch = content.match(/"summary":\s*"([^"]+)"/);
      
      return {
        title: titleMatch ? titleMatch[1] : `${type.charAt(0).toUpperCase() + type.slice(1)} Recap`,
        summary: summaryMatch ? summaryMatch[1] : content.substring(0, 200) + '...',
        keyMoments: []
      };
    }
  }
}

module.exports = OpenAIService;
