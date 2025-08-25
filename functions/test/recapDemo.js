/**
 * Recap Generation Demonstration
 * Shows exactly what prompts are sent to OpenAI for recap generation
 */

console.log('🔍 RECAP GENERATION DEMONSTRATION');
console.log('==================================\n');

// Mock the OpenAI service to show prompts without API calls
class RecapPromptDemo {
  constructor() {
    this.model = 'gpt-4-turbo-preview';
  }

  buildPrompt(journalData, recapType) {
    const { totalEntries, entries, summary } = journalData;
    const childName = 'Emma';
    
    let prompt = '';
    
    switch (recapType) {
      case 'weekly':
        return this.buildWeeklyPrompt(journalData, childName);
      case 'monthly':
        return this.buildMonthlyPrompt(journalData, childName);
      case 'yearly':
        return this.buildYearlyPrompt(journalData, childName);
      default:
        return this.buildWeeklyPrompt(journalData, childName);
    }
  }

  buildWeeklyPrompt(data, childName) {
    const { entries, summary } = data;
    
    return `Create a warm, parent-voice weekly recap for ${childName}'s journal entries from this week.

Journal entries to include:
${entries.map((entry, index) => `${index + 1}. ${entry.content}`).join('\n')}

Milestones this week: ${summary.milestones.totalMilestones}
Media captured: ${summary.media.totalMediaCount}
Favorite moments: ${data.favorites || 0}

Please create a warm, engaging weekly summary that captures the essence of ${childName}'s week. Include specific details from the entries and make it feel personal and heartfelt. Format as JSON with title, summary, keyMoments, emotionalTone, highlights, and insights.`;
  }

  buildMonthlyPrompt(data, childName) {
    const { entries, summary } = data;
    
    return `Create a comprehensive monthly recap for ${childName}'s journal entries from this month.

Journal entries to include:
${entries.map((entry, index) => `${index + 1}. ${entry.content}`).join('\n')}

Monthly overview:
- Total entries: ${data.totalEntries}
- Milestones achieved: ${summary.milestones.totalMilestones}
- Media captured: ${summary.media.totalMediaCount}
- Favorite moments: ${data.favorites || 0}

Please create a comprehensive monthly summary that tells the story of ${childName}'s month. Include growth insights, milestone celebrations, and emotional highlights. Format as JSON with title, summary, keyMoments, emotionalTone, highlights, and insights.`;
  }

  buildYearlyPrompt(data, childName) {
    const { entries, summary } = data;
    
    return `Create a beautiful yearly recap for ${childName}'s journal entries from this year.

Journal entries to include:
${entries.map((entry, index) => `${index + 1}. ${entry.content}`).join('\n')}

Yearly journey:
- Total entries: ${data.totalEntries}
- Milestones achieved: ${summary.milestones.totalMilestones}
- Media captured: ${summary.media.totalMediaCount}
- Favorite moments: ${data.favorites || 0}

Please create a beautiful yearly summary that captures ${childName}'s incredible journey of growth and discovery. Include major milestones, emotional highlights, and insights into development. Format as JSON with title, summary, keyMoments, emotionalTone, highlights, and insights.`;
  }

  parseGeneratedContent(content) {
    try {
      return JSON.parse(content);
    } catch (error) {
      // Fallback parsing for non-JSON responses
      return {
        title: "Emma's Amazing Week",
        summary: "This week was filled with incredible milestones and precious moments.",
        keyMoments: [
          {
            moment: "First steps",
            significance: "Emma took her first independent steps"
          }
        ],
        emotionalTone: "positive",
        highlights: ["First steps", "First word"],
        insights: ["Emma is developing rapidly", "She shows great determination"]
      };
    }
  }
}

// Test data - realistic journal entries
const testJournalData = {
  totalEntries: 5,
  entries: [
    {
      id: 'entry1',
      content: 'Today Emma took her first steps! She was so excited and proud of herself. We captured it on video - her little face lighting up with joy was priceless.',
      date: new Date('2024-01-15'),
      isMilestone: true,
      isFavorited: true,
      mediaCount: 1,
      childAgeAtEntry: '12 months'
    },
    {
      id: 'entry2',
      content: 'Emma said her first word today - "mama"! I was cooking dinner and she just looked at me and said it so clearly. My heart melted.',
      date: new Date('2024-01-14'),
      isMilestone: true,
      isFavorited: true,
      mediaCount: 0,
      childAgeAtEntry: '11 months'
    },
    {
      id: 'entry3',
      content: 'Emma had her first taste of solid food today! Sweet potatoes were a hit. She made the funniest faces but kept wanting more.',
      date: new Date('2024-01-13'),
      isMilestone: true,
      isFavorited: false,
      mediaCount: 1,
      childAgeAtEntry: '6 months'
    },
    {
      id: 'entry4',
      content: 'Today was just a beautiful day at the park. Emma loved watching the birds and feeling the grass under her feet.',
      date: new Date('2024-01-12'),
      isMilestone: false,
      isFavorited: true,
      mediaCount: 2,
      childAgeAtEntry: '10 months'
    },
    {
      id: 'entry5',
      content: 'Emma slept through the night for the first time! We actually got 8 hours of sleep. This feels like a major parenting milestone.',
      date: new Date('2024-01-11'),
      isMilestone: false,
      isFavorited: true,
      mediaCount: 0,
      childAgeAtEntry: '8 months'
    }
  ],
  summary: {
    milestones: {
      totalMilestones: 3,
      milestoneEntries: ['entry1', 'entry2', 'entry3']
    },
    media: {
      totalMediaEntries: 3,
      totalMediaCount: 4,
      photoEntries: 2,
      videoEntries: 2
    },
    favoritedEntries: 4
  },
  dateRange: {
    start: new Date('2024-01-08'),
    end: new Date('2024-01-15')
  }
};

// Run demonstration
function demonstrateRecapGeneration() {
  const demo = new RecapPromptDemo();
  
  console.log('📊 TEST DATA SUMMARY:');
  console.log(`   Total Entries: ${testJournalData.totalEntries}`);
  console.log(`   Milestones: ${testJournalData.summary.milestones.totalMilestones}`);
  console.log(`   Media Items: ${testJournalData.summary.media.totalMediaCount}`);
  console.log(`   Favorited: ${testJournalData.summary.favoritedEntries}`);
  console.log(`   Date Range: ${testJournalData.dateRange.start.toDateString()} - ${testJournalData.dateRange.end.toDateString()}`);
  
  console.log('\n📋 INDIVIDUAL ENTRIES:');
  testJournalData.entries.forEach((entry, index) => {
    console.log(`   ${index + 1}. ${entry.content.substring(0, 50)}...`);
    console.log(`      📅 ${entry.date.toDateString()} | 🎯 ${entry.isMilestone ? 'Milestone' : 'Regular'} | 💝 ${entry.isFavorited ? 'Favorited' : 'Not favorited'}`);
  });
  
  console.log('\n🎯 PROMPTS THAT WILL BE SENT TO OPENAI:');
  
  // Weekly prompt
  console.log('\n📅 WEEKLY RECAP PROMPT:');
  console.log('='.repeat(50));
  const weeklyPrompt = demo.buildPrompt(testJournalData, 'weekly');
  console.log(weeklyPrompt);
  
  // Monthly prompt
  console.log('\n📅 MONTHLY RECAP PROMPT:');
  console.log('='.repeat(50));
  const monthlyPrompt = demo.buildPrompt(testJournalData, 'monthly');
  console.log(monthlyPrompt);
  
  // Yearly prompt
  console.log('\n📅 YEARLY RECAP PROMPT:');
  console.log('='.repeat(50));
  const yearlyPrompt = demo.buildPrompt(testJournalData, 'yearly');
  console.log(yearlyPrompt);
  
  // Mock AI response
  console.log('\n🤖 MOCK AI RESPONSE:');
  console.log('='.repeat(50));
  const mockResponse = {
    title: "Emma's Amazing Week",
    summary: "This week was absolutely incredible for Emma! She took her first independent steps, said her first word 'mama', and had her first taste of sweet potatoes. Each moment was filled with pure joy and wonder. Watching her discover new abilities and express herself has been the most beautiful experience. Her little face lighting up with pride when she took those first steps was priceless, and hearing her say 'mama' for the first time melted our hearts completely.",
    keyMoments: [
      {
        moment: "First steps",
        significance: "Emma took her first independent steps, marking a major physical development milestone"
      },
      {
        moment: "First word",
        significance: "Emma said 'mama' clearly, showing her developing communication skills"
      },
      {
        moment: "First solid food",
        significance: "Emma tried sweet potatoes and loved them, beginning her solid food journey"
      }
    ],
    emotionalTone: "joyful and proud",
    highlights: [
      "First independent steps",
      "First word 'mama'",
      "First solid food experience",
      "Sleeping through the night",
      "Beautiful park day"
    ],
    insights: [
      "Emma is developing rapidly across all areas",
      "She shows great determination and pride in her achievements",
      "Her personality is shining through with each new skill",
      "She responds positively to new experiences",
      "She's building confidence with each milestone"
    ]
  };
  
  console.log(JSON.stringify(mockResponse, null, 2));
  
  console.log('\n✅ RECAP GENERATION WORKFLOW COMPLETE');
  console.log('This demonstrates exactly what happens when you call the recap services');
  
  return {
    weeklyPromptLength: weeklyPrompt.length,
    monthlyPromptLength: monthlyPrompt.length,
    yearlyPromptLength: yearlyPrompt.length,
    mockResponse: mockResponse,
    testData: testJournalData
  };
}

// Run the demonstration
const results = demonstrateRecapGeneration();

console.log('\n📊 TECHNICAL SUMMARY:');
console.log(`Weekly prompt: ${results.weeklyPromptLength} characters`);
console.log(`Monthly prompt: ${results.monthlyPromptLength} characters`);
console.log(`Yearly prompt: ${results.yearlyPromptLength} characters`);
console.log(`Test entries: ${results.testData.totalEntries}`);
console.log(`Milestones: ${results.testData.summary.milestones.totalMilestones}`);

// Export for testing
module.exports = { demonstrateRecapGeneration };
