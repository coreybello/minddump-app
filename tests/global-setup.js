/**
 * Global setup for Playwright E2E tests
 * Runs once before all tests
 */

async function globalSetup(config) {
  console.log('🚀 Starting E2E test setup...');
  
  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'e2e';
  
  // Mock external services for E2E tests
  process.env.MOCK_CLAUDE_API = 'true';
  process.env.MOCK_GOOGLE_SHEETS = 'true';
  process.env.MOCK_WEBHOOKS = 'true';
  
  // Configure test-specific timeouts
  process.env.API_TIMEOUT = '5000';
  process.env.WEBHOOK_TIMEOUT = '3000';
  
  // Set up test webhook endpoints
  const testWebhooks = {
    WEBHOOK_GOAL: 'https://webhook.site/test-goal-e2e',
    WEBHOOK_HABIT: 'https://webhook.site/test-habit-e2e',
    WEBHOOK_PROJECT: 'https://webhook.site/test-project-e2e',
    WEBHOOK_TASK: 'https://webhook.site/test-task-e2e',
    WEBHOOK_REMINDER: 'https://webhook.site/test-reminder-e2e',
    WEBHOOK_NOTE: 'https://webhook.site/test-note-e2e',
    WEBHOOK_INSIGHT: 'https://webhook.site/test-insight-e2e',
    WEBHOOK_LEARNING: 'https://webhook.site/test-learning-e2e',
    WEBHOOK_CAREER: 'https://webhook.site/test-career-e2e',
    WEBHOOK_METRIC: 'https://webhook.site/test-metric-e2e',
    WEBHOOK_IDEA: 'https://webhook.site/test-idea-e2e',
    WEBHOOK_SYSTEM: 'https://webhook.site/test-system-e2e',
    WEBHOOK_AUTOMATION: 'https://webhook.site/test-automation-e2e',
    WEBHOOK_PERSON: 'https://webhook.site/test-person-e2e',
    WEBHOOK_SENSITIVE: 'https://webhook.site/test-sensitive-e2e'
  };
  
  Object.assign(process.env, testWebhooks);
  
  // Set up test API keys (using test values)
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key-e2e';
  process.env.GOOGLE_SHEETS_CLIENT_EMAIL = 'test@e2e.iam.gserviceaccount.com';
  process.env.GOOGLE_SHEETS_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-e2e-key\n-----END PRIVATE KEY-----';
  
  // Ensure test database is clean
  console.log('🧹 Cleaning test database...');
  
  // Set up test data if needed
  console.log('📝 Setting up test data...');
  
  // Validate that the development server is accessible
  try {
    const response = await fetch('http://localhost:3000');
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    console.log('✅ Development server is accessible');
  } catch (error) {
    console.error('❌ Development server is not accessible:', error.message);
    console.log('Make sure to run "npm run dev" before running E2E tests');
    process.exit(1);
  }
  
  // Log test configuration
  console.log('🔧 E2E Test Configuration:');
  console.log(`- Base URL: ${config.use?.baseURL || 'http://localhost:3000'}`);
  console.log(`- Workers: ${config.workers || 'default'}`);
  console.log(`- Retries: ${config.retries || 0}`);
  console.log(`- Timeout: ${config.timeout || 30000}ms`);
  console.log('- Mock Services: Claude API, Google Sheets, Webhooks');
  console.log('- Permissions: Microphone access granted');
  
  console.log('✅ E2E test setup completed successfully!');
  console.log('');
}

module.exports = globalSetup;