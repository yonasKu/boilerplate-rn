// Load environment variables
require('dotenv').config();

// Import the functions
const functions = require('./index.js');

// Import Express
const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());

// Endpoint to test the generateWeeklyRecap function
app.post('/generateWeeklyRecap', async (req, res) => {
  try {
    console.log('🚀 Triggering weekly recap generation...');
    
    // Extract data from request body
    const { data } = req.body;
    
    // Mock context for the function call
    const context = {
      auth: {
        uid: data.userId
      }
    };
    
    console.log(`Generating weekly recap for user ${data.userId}, child ${data.childId}...`);
    
    // Call the function
    const result = await functions.generateWeeklyRecap(data, context);
    
    console.log('✅ Weekly recap generation completed successfully!');
    res.json({ result });
  } catch (error) {
    console.error('❌ Weekly recap generation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
});
