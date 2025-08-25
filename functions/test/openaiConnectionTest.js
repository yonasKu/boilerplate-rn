/**
 * OpenAI Connection Test
 * Tests if OpenAI API key is properly configured and can generate recaps
 */

const dotenv = require('dotenv');
dotenv.config();

console.log('🔍 OPENAI CONNECTION TEST');
console.log('========================\n');

// Check environment variables
console.log('📋 ENVIRONMENT CHECK:');
console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   OPENAI_MODEL: ${process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'}`);
console.log(`   MAX_TOKENS: ${process.env.MAX_TOKENS || '1000'}`);

if (!process.env.OPENAI_API_KEY) {
  console.log('\n❌ OPENAI_API_KEY is required for recap generation');
  console.log('   Please set OPENAI_API_KEY in your .env file');
  console.log('   Get your API key from: https://platform.openai.com/api-keys');
  process.exit(1);
}

// Test OpenAI connection
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAIConnection() {
  console.log('\n🧪 TESTING OPENAI CONNECTION...');
  
  try {
    // Simple test prompt
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Generate a very short test response: 'Hello from OpenAI'"
        }
      ],
      max_tokens: 10
    });
    
    console.log('✅ OpenAI Connection Successful!');
    console.log(`   Response: ${response.choices[0].message.content}`);
    
    return true;
  } catch (error) {
    console.error('❌ OpenAI Connection Failed:', error.message);
    return false;
  }
}

// Test recap prompt generation
async function testRecapPrompt() {
  console.log('\n🧪 TESTING RECAP PROMPT GENERATION...');
  
  const testPrompt = `Create a weekly recap for Emma based on these journal entries:
1. First steps today! Emma was so proud
2. First word "mama" - such a special moment
3. First solid food - sweet potatoes were a hit

Generate a warm, parent-voice summary. Format as JSON with title, summary, keyMoments, emotionalTone, highlights, and insights.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: testPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    
    const content = response.choices[0].message.content;
    console.log('✅ Recap Prompt Generation Successful!');
    console.log(`   Generated content length: ${content.length} characters`);
    
    try {
      const parsed = JSON.parse(content);
      console.log('✅ Response is valid JSON');
      console.log(`   Title: ${parsed.title}`);
      console.log(`   Summary: ${parsed.summary?.substring(0, 100)}...`);
    } catch (parseError) {
      console.log('⚠️ Response is not JSON - will use fallback parsing');
      console.log(`   Raw response: ${content.substring(0, 200)}...`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Recap Prompt Generation Failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting OpenAI Connection Tests...\n');
  
  const results = {
    connection: false,
    recapGeneration: false
  };
  
  try {
    results.connection = await testOpenAIConnection();
    results.recapGeneration = await testRecapPrompt();
    
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log(`   OpenAI Connection: ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Recap Generation: ${results.recapGeneration ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = results.connection && results.recapGeneration;
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ All Tests Passed' : '❌ Some Tests Failed'}`);
    
    if (allPassed) {
      console.log('\n🎉 Your recap generation is ready to use!');
      console.log('   You can now generate weekly, monthly, and yearly recaps');
    } else {
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Check your OPENAI_API_KEY is valid');
      console.log('   2. Ensure you have billing set up in OpenAI');
      console.log('   3. Check your internet connection');
    }
    
    return allPassed;
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    return false;
  }
}

// CLI interface
if (require.main === module) {
  runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
