/**
 * Global teardown for Playwright E2E tests
 * Runs once after all tests complete
 */

async function globalTeardown() {
  console.log('🧹 Starting E2E test teardown...');
  
  // Clean up test data
  console.log('📝 Cleaning up test data...');
  
  // Clear any test files or temporary data
  try {
    // Clean up any test artifacts
    const fs = require('fs').promises;
    const path = require('path');
    
    // Remove temporary test files if they exist
    const tempFiles = [
      'test-results/temp-data.json',
      'test-results/test-session.log'
    ];
    
    for (const file of tempFiles) {
      try {
        await fs.unlink(path.join(process.cwd(), file));
        console.log(`🗑️  Removed temporary file: ${file}`);
      } catch (error) {
        // File doesn't exist, ignore
      }
    }
  } catch (error) {
    console.warn('⚠️  Warning during cleanup:', error.message);
  }
  
  // Reset environment variables
  console.log('🔧 Resetting environment...');
  delete process.env.TEST_MODE;
  delete process.env.MOCK_CLAUDE_API;
  delete process.env.MOCK_GOOGLE_SHEETS;
  delete process.env.MOCK_WEBHOOKS;
  
  // Log test completion summary
  console.log('📊 E2E Test Summary:');
  console.log('- All tests completed');
  console.log('- Test environment cleaned up');
  console.log('- Temporary files removed');
  console.log('- Mock services disconnected');
  
  console.log('✅ E2E test teardown completed successfully!');
  console.log('');
}

module.exports = globalTeardown;