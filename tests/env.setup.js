/**
 * Environment setup for tests
 * Sets up necessary environment variables and global configurations
 */

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-api-key-12345';
process.env.GOOGLE_SHEETS_CLIENT_EMAIL = 'test@serviceaccount.iam.gserviceaccount.com';
process.env.GOOGLE_SHEETS_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-private-key-content\n-----END PRIVATE KEY-----';
process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-supabase-anon-key-12345';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-12345';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.GITHUB_ID = 'test-github-client-id';
process.env.GITHUB_SECRET = 'test-github-client-secret';

// Test-specific configurations
process.env.WEBHOOK_TIMEOUT = '5000'; // 5 seconds for faster tests
process.env.CLAUDE_TIMEOUT = '10000'; // 10 seconds for faster tests
process.env.SHEETS_TIMEOUT = '8000'; // 8 seconds for faster tests

// Disable external network calls in tests
process.env.DISABLE_EXTERNAL_REQUESTS = 'true';

// Test database configuration
process.env.TEST_DATABASE_URL = 'sqlite::memory:';

// Set up test webhook URLs
process.env.WEBHOOK_GOAL = 'https://webhook.site/test-goal-123';
process.env.WEBHOOK_HABIT = 'https://webhook.site/test-habit-123';
process.env.WEBHOOK_PROJECT = 'https://webhook.site/test-project-123';
process.env.WEBHOOK_TASK = 'https://webhook.site/test-task-123';
process.env.WEBHOOK_REMINDER = 'https://webhook.site/test-reminder-123';
process.env.WEBHOOK_NOTE = 'https://webhook.site/test-note-123';
process.env.WEBHOOK_INSIGHT = 'https://webhook.site/test-insight-123';
process.env.WEBHOOK_LEARNING = 'https://webhook.site/test-learning-123';
process.env.WEBHOOK_CAREER = 'https://webhook.site/test-career-123';
process.env.WEBHOOK_METRIC = 'https://webhook.site/test-metric-123';
process.env.WEBHOOK_IDEA = 'https://webhook.site/test-idea-123';
process.env.WEBHOOK_SYSTEM = 'https://webhook.site/test-system-123';
process.env.WEBHOOK_AUTOMATION = 'https://webhook.site/test-automation-123';
process.env.WEBHOOK_PERSON = 'https://webhook.site/test-person-123';
process.env.WEBHOOK_SENSITIVE = 'https://webhook.site/test-sensitive-123';

// Mock external service configurations
process.env.MOCK_CLAUDE_API = 'true';
process.env.MOCK_GOOGLE_SHEETS = 'true';
process.env.MOCK_WEBHOOKS = 'true';
process.env.MOCK_SUPABASE = 'true';

// Test logging configuration
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests
process.env.DISABLE_CONSOLE_LOGS = 'false'; // Allow console logs for debugging

// Performance test configurations
process.env.MAX_CONCURRENT_REQUESTS = '10';
process.env.RATE_LIMIT_REQUESTS_PER_MINUTE = '100'; // Higher limit for tests
process.env.REQUEST_TIMEOUT = '30000'; // 30 seconds max

// Security test configurations
process.env.ENABLE_RATE_LIMITING = 'true';
process.env.ENABLE_SECURITY_HEADERS = 'true';
process.env.ENABLE_INPUT_VALIDATION = 'true';
process.env.ENABLE_SANITIZATION = 'true';

// Feature flags for testing
process.env.ENABLE_VOICE_INPUT = 'true';
process.env.ENABLE_GOOGLE_SHEETS = 'true';
process.env.ENABLE_WEBHOOKS = 'true';
process.env.ENABLE_AI_CATEGORIZATION = 'true';
process.env.ENABLE_SENSITIVE_FILTERING = 'true';

// Test data configurations
process.env.MAX_INPUT_LENGTH = '50000';
process.env.MAX_ACTIONS_COUNT = '50';
process.env.MAX_WEBHOOK_PAYLOAD_SIZE = '1048576'; // 1MB

// Development and debugging
process.env.DEBUG_MODE = 'false';
process.env.VERBOSE_LOGGING = 'false';
process.env.TRACK_PERFORMANCE = 'true';

console.log('🧪 Test environment configured with the following features:');
console.log('- AI Categorization: enabled');
console.log('- Voice Input: enabled');
console.log('- Google Sheets: enabled (mocked)');
console.log('- Webhooks: enabled (mocked)');
console.log('- Security: enabled');
console.log('- Rate Limiting: enabled');
console.log('- Performance Tracking: enabled');
console.log('');

// Validate required environment variables
const requiredVars = [
  'ANTHROPIC_API_KEY',
  'GOOGLE_SHEETS_CLIENT_EMAIL',
  'GOOGLE_SHEETS_PRIVATE_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn(`⚠️  Missing test environment variables: ${missingVars.join(', ')}`);
  console.warn('Some tests may fail or be skipped');
}

// Export test configuration for use in tests
global.TEST_CONFIG = {
  api: {
    timeout: parseInt(process.env.CLAUDE_TIMEOUT),
    maxRetries: 3,
    rateLimit: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE)
  },
  webhooks: {
    timeout: parseInt(process.env.WEBHOOK_TIMEOUT),
    maxPayloadSize: parseInt(process.env.MAX_WEBHOOK_PAYLOAD_SIZE),
    retryAttempts: 3
  },
  input: {
    maxLength: parseInt(process.env.MAX_INPUT_LENGTH),
    maxActions: parseInt(process.env.MAX_ACTIONS_COUNT)
  },
  performance: {
    maxResponseTime: 5000,
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS)
  },
  features: {
    voiceInput: process.env.ENABLE_VOICE_INPUT === 'true',
    googleSheets: process.env.ENABLE_GOOGLE_SHEETS === 'true',
    webhooks: process.env.ENABLE_WEBHOOKS === 'true',
    aiCategorization: process.env.ENABLE_AI_CATEGORIZATION === 'true',
    sensitiveFiltering: process.env.ENABLE_SENSITIVE_FILTERING === 'true'
  },
  mocks: {
    claudeApi: process.env.MOCK_CLAUDE_API === 'true',
    googleSheets: process.env.MOCK_GOOGLE_SHEETS === 'true',
    webhooks: process.env.MOCK_WEBHOOKS === 'true',
    supabase: process.env.MOCK_SUPABASE === 'true'
  }
};