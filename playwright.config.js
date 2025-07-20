import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Mind Dump app E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }]
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for all tests */
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Grant microphone permissions for voice input tests
        contextOptions: {
          permissions: ['microphone']
        }
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        contextOptions: {
          permissions: ['microphone']
        }
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        contextOptions: {
          permissions: ['microphone']
        }
      },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        contextOptions: {
          permissions: ['microphone']
        }
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        contextOptions: {
          permissions: ['microphone']
        }
      },
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { 
        ...devices['Desktop Edge'], 
        channel: 'msedge',
        contextOptions: {
          permissions: ['microphone']
        }
      },
    },
    {
      name: 'Google Chrome',
      use: { 
        ...devices['Desktop Chrome'], 
        channel: 'chrome',
        contextOptions: {
          permissions: ['microphone']
        }
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
  },

  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/global-setup.js'),
  globalTeardown: require.resolve('./tests/global-teardown.js'),

  /* Test timeout */
  timeout: 60 * 1000, // 60 seconds

  /* Expect timeout */
  expect: {
    timeout: 10 * 1000, // 10 seconds
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/',

  /* Test ignore patterns */
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**'
  ],

  /* Test match patterns */
  testMatch: [
    '**/tests/e2e/**/*.test.js',
    '**/tests/e2e/**/*.spec.js'
  ],

  /* Environment variables for tests */
  use: {
    ...devices['Desktop Chrome'],
    extraHTTPHeaders: {
      'X-Test-Environment': 'e2e'
    },
    // Set up test data attributes selector engine
    testIdAttribute: 'data-testid'
  }
});