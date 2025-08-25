/**
 * Integration Test Script for SproutBook Services
 * Tests journal aggregation, OpenAI service, and recap generation
 */

const JournalAggregator = require('../services/journalAggregator');
const AutomatedRecapService = require('../services/recapGenerator');
const OpenAIService = require('../services/openAIService');
const { db } = require('../firebaseAdmin');

class IntegrationTester {
  constructor() {
    this.journalAggregator = new JournalAggregator();
    this.recapService = new AutomatedRecapService();
    this.openAIService = new OpenAIService();
  }

  /**
   * Test journal aggregation with actual data structure
   */
  async testJournalAggregation() {
    console.log('🧪 Testing Journal Aggregation...');
    
    try {
      // Test with mock user and child IDs
      const mockUserId = 'test_user_123';
      const mockChildId = 'test_child_456';
      
      // Set date range for testing
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days

      const result = await this.journalAggregator.aggregateJournalEntries({
        userId: mockUserId,
        childId: mockChildId,
        type: 'weekly',
        startDate,
        endDate
      });

      console.log('✅ Journal Aggregation Test Results:');
      console.log(`   - Total Entries: ${result.totalEntries}`);
      console.log(`   - Image Metadata: ${JSON.stringify(result.imageMetadata, null, 2)}`);
      console.log(`   - Summary: ${JSON.stringify(result.summary, null, 2)}`);
      console.log(`   - Processing Time: ${result.processingTime}ms`);
      
      return {
        success: true,
        totalEntries: result.totalEntries,
        imageMetadata: result.imageMetadata,
        summary: result.summary,
        processingTime: result.processingTime
      };
    } catch (error) {
      console.error('❌ Journal Aggregation Test Failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test image metadata extraction from journal entries
   */
  async testImageMetadataExtraction() {
    console.log('🧪 Testing Image Metadata Extraction...');
    
    try {
      // Mock journal entries with images
      const mockEntries = [
        {
          id: 'entry1',
          text: 'Today we went to the park',
          media: [
            { type: 'image/jpeg', size: 1024000, url: 'https://example.com/image1.jpg' },
            { type: 'image/png', size: 2048000, url: 'https://example.com/image2.png' }
          ],
          createdAt: new Date()
        },
        {
          id: 'entry2',
          text: 'Another great day',
          media: [
            { type: 'image/jpeg', size: 512000, url: 'https://example.com/image3.jpg' }
          ],
          createdAt: new Date()
        },
        {
          id: 'entry3',
          text: 'No images today',
          media: [],
          createdAt: new Date()
        }
      ];

      const imageMetadata = await this.journalAggregator.extractImageMetadata(mockEntries);
      
      console.log('✅ Image Metadata Test Results:');
      console.log(`   - Total Images: ${imageMetadata.totalImages}`);
      console.log(`   - Has Images: ${imageMetadata.hasImages}`);
      console.log(`   - Image Types: ${imageMetadata.imageTypes.join(', ')}`);
      console.log(`   - Total Size: ${imageMetadata.totalSize} bytes`);
      
      // Validation
      const expectedTotalImages = 3;
      const expectedHasImages = true;
      const expectedImageTypes = ['image/jpeg', 'image/png'];
      const expectedTotalSize = 3584000;
      
      const validation = {
        totalImages: imageMetadata.totalImages === expectedTotalImages,
        hasImages: imageMetadata.hasImages === expectedHasImages,
        imageTypes: JSON.stringify(imageMetadata.imageTypes.sort()) === JSON.stringify(expectedImageTypes.sort()),
        totalSize: imageMetadata.totalSize === expectedTotalSize
      };
      
      console.log('   - Validation:', validation);
      
      return {
        success: true,
        imageMetadata,
        validation
      };
    } catch (error) {
      console.error('❌ Image Metadata Test Failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test recap generation with image metadata
   */
  async testRecapGenerationWithImages() {
    console.log('🧪 Testing Recap Generation with Image Metadata...');
    
    try {
      const mockUserId = 'test_user_123';
      const mockChildId = 'test_child_456';
      const mockChildName = 'Emma';
      const mockChildAge = '5 years old';
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const result = await this.recapService.generateRecap({
        userId: mockUserId,
        childId: mockChildId,
        childName: mockChildName,
        childAge: mockChildAge,
        type: 'weekly',
        startDate,
        endDate
      });

      console.log('✅ Recap Generation Test Results:');
      console.log(`   - Recap ID: ${result.recapId}`);
      console.log(`   - Status: ${result.status}`);
      console.log(`   - Has Image Metadata: ${!!result.imageMetadata}`);
      
      if (result.imageMetadata) {
        console.log(`   - Image Count: ${result.imageMetadata.count}`);
        console.log(`   - Image Types: ${result.imageMetadata.imageTypes.join(', ')}`);
      }
      
      return {
        success: true,
        recapId: result.recapId,
        status: result.status,
        imageMetadata: result.imageMetadata
      };
    } catch (error) {
      console.error('❌ Recap Generation Test Failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test OpenAI prompt generation with actual journal structure
   */
  async testOpenAIPromptGeneration() {
    console.log('🧪 Testing OpenAI Prompt Generation...');
    
    try {
      // Create mock journal data with actual structure
      const mockJournalData = {
        totalEntries: 5,
        entries: [
          {
            id: 'entry1',
            content: 'Today was a beautiful day watching Emma take her first steps! She was so excited and proud of herself. We captured it on video - her little face lighting up with joy was priceless.',
            date: new Date(),
            isMilestone: true,
            isFavorited: true,
            mediaCount: 1,
            childAgeAtEntry: '12 months'
          },
          {
            id: 'entry2',
            content: 'Emma said her first word today - "mama"! I was cooking dinner and she just looked at me and said it so clearly. My heart melted.',
            date: new Date(Date.now() - 86400000), // Yesterday
            isMilestone: true,
            isFavorited: true,
            mediaCount: 0,
            childAgeAtEntry: '11 months'
          }
        ],
        summary: {
          milestones: {
            totalMilestones: 2,
            milestoneEntries: ['entry1', 'entry2']
          },
          media: {
            totalMediaEntries: 1,
            totalMediaItems: 1,
            photoEntries: 0,
            videoEntries: 1
          },
          favoritedEntries: 2
        },
        dateRange: {
          start: new Date(Date.now() - 7 * 86400000),
          end: new Date()
        }
      };

      const prompt = this.openAIService.buildPrompt(mockJournalData, 'weekly');
      console.log('✅ OpenAI Prompt Generation Test Results:');
      console.log(`   - Prompt Length: ${prompt.length} characters`);
      console.log(`   - Prompt Preview: ${prompt.substring(0, 200)}...`);
      
      return {
        success: true,
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 200)
      };
    } catch (error) {
      console.error('❌ OpenAI Prompt Generation Test Failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test recap generation service
   */
  async testRecapGeneration() {
    console.log('🧪 Testing Recap Generation Service...');
    
    try {
      const mockUserId = 'test_user_123';
      const mockChildId = 'test_child_456';
      
      // Set date range for testing
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const weekRange = { start: startDate, end: endDate };

      const result = await this.recapService.generateWeeklyRecap(
        mockUserId,
        mockChildId,
        weekRange
      );

      console.log('✅ Recap Generation Test Results:');
      console.log(`   - Success: ${result.success}`);
      console.log(`   - Total Entries: ${result.totalEntries}`);
      console.log(`   - Processing Time: ${result.processingTime}ms`);
      
      if (result.success) {
        console.log(`   - Recap ID: ${result.id}`);
        console.log(`   - Title: ${result.title}`);
      } else {
        console.log(`   - Error: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Recap Generation Test Failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test Firestore connection and data structure
   */
  async testFirestoreConnection() {
    console.log('🧪 Testing Firestore Connection...');
    
    try {
      // Test basic Firestore operations
      const testDoc = db.collection('test').doc('connection_test');
      await testDoc.set({
        timestamp: new Date(),
        message: 'Connection test successful'
      });

      const doc = await testDoc.get();
      
      console.log('✅ Firestore Connection Test Results:');
      console.log(`   - Connection: ${doc.exists ? 'Successful' : 'Failed'}`);
      console.log(`   - Timestamp: ${doc.data().timestamp}`);
      
      // Clean up test document
      await testDoc.delete();
      
      return {
        success: true,
        timestamp: doc.data().timestamp
      };
    } catch (error) {
      console.error('❌ Firestore Connection Test Failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    console.log('🚀 Starting SproutBook Service Integration Tests\n');
    
    const results = {
      firestore: null,
      journalAggregation: null,
      imageMetadataExtraction: null,
      recapGenerationWithImages: null,
      openAIPrompt: null,
      recapGeneration: null
    };

    try {
      // Test Firestore connection
      results.firestore = await this.testFirestoreConnection();
      
      // Test journal aggregation
      results.journalAggregation = await this.testJournalAggregation();
      
      // Test image metadata extraction
      results.imageMetadataExtraction = await this.testImageMetadataExtraction();
      
      // Test recap generation with images
      results.recapGenerationWithImages = await this.testRecapGenerationWithImages();
      
      // Test OpenAI prompt generation
      results.openAIPrompt = await this.testOpenAIPromptGeneration();
      
      // Test recap generation
      results.recapGeneration = await this.testRecapGeneration();

      // Summary
      console.log('\n📊 Test Summary:');
      console.log(`   Firestore Connection: ${results.firestore.success ? '✅' : '❌'}`);
      console.log(`   Journal Aggregation: ${results.journalAggregation.success ? '✅' : '❌'}`);
      console.log(`   Image Metadata Extraction: ${results.imageMetadataExtraction.success ? '✅' : '❌'}`);
      console.log(`   Recap Generation With Images: ${results.recapGenerationWithImages.success ? '✅' : '❌'}`);
      console.log(`   OpenAI Prompt: ${results.openAIPrompt.success ? '✅' : '❌'}`);
      console.log(`   Recap Generation: ${results.recapGeneration.success ? '✅' : '❌'}`);

      const allPassed = Object.values(results).every(result => result && result.success);
      console.log(`\n🎯 Overall Result: ${allPassed ? '✅ All Tests Passed' : '❌ Some Tests Failed'}`);

      return results;
    } catch (error) {
      console.error('❌ Test Suite Failed:', error.message);
      return results;
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllTests()
    .then(results => {
      process.exit(results.firestore?.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = IntegrationTester;
