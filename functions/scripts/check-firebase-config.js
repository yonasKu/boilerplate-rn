#!/usr/bin/env node

/**
 * Script to check for legacy Firebase configuration
 * This helps identify if any migration is needed from functions.config()
 */

const { exec } = require('child_process');

console.log('🔍 Checking for legacy Firebase configuration...');

// Check if firebase-tools is installed
exec('firebase --version', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Firebase CLI not found. Please install it with: npm install -g firebase-tools');
    return;
  }
  
  console.log(`✅ Firebase CLI version: ${stdout.trim()}`);
  
  // Check for legacy configuration
  exec('firebase functions:config:get', (error, stdout, stderr) => {
    if (error) {
      console.log('ℹ️  No legacy configuration found or not logged in to Firebase');
      console.log('   Error:', error.message);
      return;
    }
    
    try {
      const config = JSON.parse(stdout);
      
      if (Object.keys(config).length === 0) {
        console.log('✅ No legacy Firebase configuration found.');
        console.log('   Your project is ready for the migration deadline.');
      } else {
        console.log('⚠️  Legacy configuration detected:');
        console.log(JSON.stringify(config, null, 2));
        console.log('\n📋 Migration steps:');
        console.log('1. Export this configuration: firebase functions:config:get > legacy-config.json');
        console.log('2. Convert to environment variables in your .env file');
        console.log('3. Update code to use process.env instead of functions.config()');
        console.log('4. Remove legacy configuration: firebase functions:config:unset <key>');
      }
    } catch (parseError) {
      console.log('ℹ️  Could not parse configuration output:');
      console.log(stdout);
    }
  });
});
