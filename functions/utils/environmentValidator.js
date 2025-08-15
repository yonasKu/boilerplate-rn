/**
 * Environment Validation Utility
 * Validates all required environment variables and provides helpful error messages
 */

const Joi = require('joi');

// Schema for environment variables validation
const envSchema = Joi.object({
  // Required Firebase configuration
  FIREBASE_PROJECT_ID: Joi.string().required(),
  
  // Required OpenAI configuration
  OPENAI_API_KEY: Joi.string().required(),
  
  // Optional with defaults
  OPENAI_MODEL: Joi.string().default('gpt-4-turbo-preview'),
  MAX_TOKENS: Joi.number().integer().min(100).max(4000).default(2000),
  TEMPERATURE: Joi.number().min(0).max(2).default(0.7),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  
  // Recap generation settings
  MIN_WEEKLY_ENTRIES: Joi.number().integer().min(1).default(3),
  MIN_MONTHLY_ENTRIES: Joi.number().integer().min(1).default(5),
  MIN_YEARLY_ENTRIES: Joi.number().integer().min(1).default(10),
  MAX_CHILDREN_PER_USER: Joi.number().integer().min(1).default(20),
  MAX_ENTRIES_PER_QUERY: Joi.number().integer().min(100).max(10000).default(1000),
  
  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: Joi.number().integer().min(1).default(60),
  MAX_REQUESTS_PER_HOUR: Joi.number().integer().min(1).default(1000),
  BURST_LIMIT: Joi.number().integer().min(1).default(10),
  
  // Timezone and scheduling
  DEFAULT_TIMEZONE: Joi.string().default('America/New_York'),
  
  // Security settings
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  SESSION_TIMEOUT: Joi.string().default('24h'),
  
  // Development settings
  ENABLE_DEBUG_MODE: Joi.boolean().default(false),
  ENABLE_MOCK_DATA: Joi.boolean().default(false),
  SKIP_AI_GENERATION: Joi.boolean().default(false),
  SKIP_FIRESTORE_QUERIES: Joi.boolean().default(false),
  ENABLE_DETAILED_LOGGING: Joi.boolean().default(true),
  ENABLE_PERFORMANCE_MONITORING: Joi.boolean().default(true),
  
  // External services (commented out - optional)
  // SENDGRID_API_KEY: Joi.string().optional(),
  // FROM_EMAIL: Joi.string().email().optional(),
  // SLACK_WEBHOOK_URL: Joi.string().uri().optional(),
  
  // Firebase emulator settings (optional)
  FIRESTORE_EMULATOR_HOST: Joi.string().optional(),
  FIREBASE_AUTH_EMULATOR_HOST: Joi.string().optional(),
  FIREBASE_STORAGE_EMULATOR_HOST: Joi.string().optional()
});

/**
 * Validate environment variables
 * @returns {Object} Validation result
 */
function validateEnvironment() {
  const { error, value } = envSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: true
  });

  if (error) {
    const errorMessage = `
      ❌ Environment Validation Failed:
      ${error.details.map(detail => `  - ${detail.message}`).join('\n')}
      
      📋 Required Environment Variables:
      ${getRequiredVariables().join('\n')}
      
      🔧 Setup Instructions:
      1. Copy .env.example to .env
      2. Fill in your actual values
      3. Get Firebase service account from: Firebase Console > Project Settings > Service Accounts
      4. Get OpenAI API key from: https://platform.openai.com/api-keys
    `;
    
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return value;
}

/**
 * Get list of required environment variables
 * @returns {string[]} List of required variables
 */
function getRequiredVariables() {
  return [
    'FIREBASE_PROJECT_ID',
    'OPENAI_API_KEY'
  ];
}

/**
 * Get list of optional environment variables with defaults
 * @returns {Object} Variables with their default values
 */
function getOptionalVariables() {
  return {
    OPENAI_MODEL: 'gpt-4-turbo-preview',
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.7,
    LOG_LEVEL: 'info',
    MIN_WEEKLY_ENTRIES: 3,
    MIN_MONTHLY_ENTRIES: 5,
    MIN_YEARLY_ENTRIES: 10,
    MAX_CHILDREN_PER_USER: 20,
    MAX_ENTRIES_PER_QUERY: 1000,
    MAX_REQUESTS_PER_MINUTE: 60,
    MAX_REQUESTS_PER_HOUR: 1000,
    BURST_LIMIT: 10,
    DEFAULT_TIMEZONE: 'America/New_York',
    CORS_ORIGIN: 'http://localhost:3000',
    SESSION_TIMEOUT: '24h',
    ENABLE_DEBUG_MODE: false,
    ENABLE_MOCK_DATA: false,
    SKIP_AI_GENERATION: false,
    SKIP_FIRESTORE_QUERIES: false,
    ENABLE_DETAILED_LOGGING: true,
    ENABLE_PERFORMANCE_MONITORING: true
  };
}

/**
 * Check if running in emulator mode
 * @returns {boolean} True if running in emulator
 */
function isEmulatorMode() {
  return !!process.env.FIRESTORE_EMULATOR_HOST || 
         !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
         !!process.env.FIREBASE_STORAGE_EMULATOR_HOST;
}

/**
 * Get current configuration summary (safe for logging)
 * @returns {Object} Configuration summary without sensitive data
 */
function getConfigSummary() {
  return {
    environment: process.env.NODE_ENV || 'development',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    maxTokens: parseInt(process.env.MAX_TOKENS) || 2000,
    temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
    logLevel: process.env.LOG_LEVEL || 'info',
    minWeeklyEntries: parseInt(process.env.MIN_WEEKLY_ENTRIES) || 3,
    minMonthlyEntries: parseInt(process.env.MIN_MONTHLY_ENTRIES) || 5,
    minYearlyEntries: parseInt(process.env.MIN_YEARLY_ENTRIES) || 10,
    maxChildrenPerUser: parseInt(process.env.MAX_CHILDREN_PER_USER) || 20,
    maxEntriesPerQuery: parseInt(process.env.MAX_ENTRIES_PER_QUERY) || 1000,
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 60,
    maxRequestsPerHour: parseInt(process.env.MAX_REQUESTS_PER_HOUR) || 1000,
    burstLimit: parseInt(process.env.BURST_LIMIT) || 10,
    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'America/New_York',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    sessionTimeout: process.env.SESSION_TIMEOUT || '24h',
    debugMode: process.env.ENABLE_DEBUG_MODE === 'true',
    mockData: process.env.ENABLE_MOCK_DATA === 'true',
    skipAIGeneration: process.env.SKIP_AI_GENERATION === 'true',
    skipFirestoreQueries: process.env.SKIP_FIRESTORE_QUERIES === 'true',
    detailedLogging: process.env.ENABLE_DETAILED_LOGGING === 'true',
    performanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
    emulatorMode: isEmulatorMode()
  };
}

module.exports = {
  validateEnvironment,
  getRequiredVariables,
  getOptionalVariables,
  isEmulatorMode,
  getConfigSummary,
  envSchema
};
