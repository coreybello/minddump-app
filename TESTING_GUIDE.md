# Mind Dump App - Testing Guide

## Overview

This guide covers the comprehensive testing strategy for the Mind Dump app, including unit tests, integration tests, and end-to-end tests for the new 15-category AI categorization system, webhook routing, Google Sheets integration, and voice input functionality.

## Quick Start

### Running All Tests
```bash
# Run all unit and integration tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run end-to-end tests
npm run test:e2e

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e:ui
```

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers (for E2E tests)
npx playwright install

# Set up environment variables (copy and modify)
cp .env.example .env.local
```

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── api.test.js         # API route tests
│   ├── categorization.test.js  # AI categorization tests
│   └── webhooks.test.js    # Webhook processing tests
├── integration/             # Integration tests
│   └── end-to-end.test.js  # Full workflow tests
├── e2e/                    # End-to-end tests
│   ├── voice-input.test.js # Voice input UI tests
│   └── categorization-ui.test.js  # Category UI tests
├── mocks/                  # Test data and mocks
│   ├── testData.js        # Sample test inputs
│   └── fileMock.js        # Static file mocks
├── setup.js               # Jest test setup
├── env.setup.js          # Environment configuration
├── global-setup.js       # Playwright global setup
└── global-teardown.js    # Playwright cleanup
```

## Test Categories

### 1. Unit Tests (`npm run test:unit`)

**API Route Tests** (`tests/unit/api.test.js`)
- Input validation and sanitization
- Rate limiting enforcement
- Security middleware validation
- Error handling and recovery
- Response format validation

**AI Categorization Tests** (`tests/unit/categorization.test.js`)
- Accuracy testing for all 15 categories
- Edge case handling (ambiguous inputs, mixed categories)
- Performance and timeout handling
- Context preservation across conversations
- Confidence scoring validation

**Webhook Processing Tests** (`tests/unit/webhooks.test.js`)
- URL mapping for all 15 categories
- Payload generation and structure
- Security headers and authentication
- Error handling and retry logic
- Sensitive content special handling

### 2. Integration Tests (`npm run test:integration`)

**End-to-End Workflow Tests** (`tests/integration/end-to-end.test.js`)
- Complete thought processing pipeline
- Google Sheets integration for project ideas
- Webhook delivery and payload validation
- Error recovery and resilience testing
- Performance under concurrent load
- Data validation and sanitization

### 3. E2E Tests (`npm run test:e2e`)

**Voice Input Tests** (`tests/e2e/voice-input.test.js`)
- Voice recognition functionality
- Speech-to-text accuracy
- Voice + categorization workflow
- Error handling for unsupported browsers
- Microphone permissions handling

**UI Categorization Tests** (`tests/e2e/categorization-ui.test.js`)
- Category dropdown functionality
- Manual vs auto-detection
- Category badge display
- Keyboard navigation
- Sensitive content UI treatment

## Test Data

### Sample Test Inputs

The test suite includes comprehensive test data in `tests/mocks/testData.js`:

- **15 Category Examples**: One representative input for each category
- **Edge Cases**: Empty inputs, too-long inputs, ambiguous content
- **Voice Inputs**: Mock audio transcripts for speech testing
- **Security Payloads**: XSS attempts, SQL injection, oversized requests
- **Performance Data**: Concurrent load testing scenarios

### Mock Responses

All external services are mocked:
- **Claude API**: Predictable categorization responses
- **Google Sheets API**: Sheet creation and data insertion
- **Webhook Endpoints**: Successful delivery confirmation
- **Supabase**: Authentication and database operations

## Environment Configuration

### Test Environment Variables

Set up these variables in your test environment:

```bash
# API Keys (use test values)
ANTHROPIC_API_KEY=test-anthropic-key
GOOGLE_SHEETS_CLIENT_EMAIL=test@serviceaccount.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...

# Webhook URLs (use webhook.site or similar for testing)
WEBHOOK_GOAL=https://webhook.site/test-goal
WEBHOOK_HABIT=https://webhook.site/test-habit
# ... (all 15 categories)

# Feature Flags
ENABLE_VOICE_INPUT=true
ENABLE_GOOGLE_SHEETS=true
ENABLE_WEBHOOKS=true
ENABLE_AI_CATEGORIZATION=true
```

### Mock Configuration

Tests automatically enable mocking:
```bash
MOCK_CLAUDE_API=true
MOCK_GOOGLE_SHEETS=true
MOCK_WEBHOOKS=true
MOCK_SUPABASE=true
```

## Running Specific Tests

### By Test Type
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e
```

### By Feature
```bash
# Categorization tests
npm test -- --testNamePattern="categorization"

# Webhook tests
npm test -- --testNamePattern="webhook"

# Voice input tests
npm run test:e2e -- --grep="voice"

# API tests
npm test -- tests/unit/api.test.js
```

### By Browser (E2E only)
```bash
# Chrome only
npm run test:e2e -- --project=chromium

# Firefox only
npm run test:e2e -- --project=firefox

# Mobile tests
npm run test:e2e -- --project="Mobile Chrome"
```

## Test Coverage

### Coverage Targets
- **Lines**: 80% minimum
- **Functions**: 80% minimum
- **Branches**: 80% minimum
- **Statements**: 80% minimum

### Generating Coverage Reports
```bash
# Generate HTML coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Coverage Areas
- API route handlers: 90%+
- AI categorization logic: 85%+
- Webhook processing: 85%+
- UI components: 80%+
- Error handling: 90%+

## Performance Testing

### Performance Benchmarks

The test suite includes performance validation:

- **API Response Time**: < 3 seconds for 95% of requests
- **Voice Processing**: < 2 seconds from speech end to text
- **Categorization Accuracy**: > 85% correct assignment
- **Webhook Delivery**: < 5 seconds from categorization
- **Google Sheets**: < 10 seconds from submission
- **Concurrent Users**: Support 100+ simultaneous users

### Load Testing
```bash
# Run performance tests
npm run test:performance

# Stress test with Artillery (if configured)
npm run test:load
```

## Debugging Tests

### Debug Mode
```bash
# Run tests with debug output
DEBUG=true npm test

# Run specific test with verbose output
npm test -- --verbose tests/unit/api.test.js

# Run E2E tests with browser visible
npm run test:e2e -- --headed
```

### Browser DevTools (E2E)
```bash
# Debug E2E tests with DevTools
npm run test:e2e -- --debug

# Run in slow motion for observation
npm run test:e2e -- --slowMo=1000
```

### Test Artifacts

Failed tests automatically generate:
- Screenshots (E2E tests)
- Video recordings (E2E tests)
- Trace files (E2E tests)
- Console logs (all tests)

Artifacts are saved to `test-results/` directory.

## Continuous Integration

### GitHub Actions Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:coverage
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Environment Setup for CI

Set these secrets in your CI environment:
- `ANTHROPIC_API_KEY`: Claude API key
- `GOOGLE_SHEETS_CREDENTIALS`: Service account JSON
- `WEBHOOK_ENDPOINTS`: Test webhook URLs

## Troubleshooting

### Common Issues

**Tests failing with "fetch is not defined"**
```bash
# Install whatwg-fetch polyfill
npm install --save-dev whatwg-fetch
```

**Voice input tests failing**
```bash
# Check browser permissions in Playwright config
contextOptions: { permissions: ['microphone'] }
```

**API tests timing out**
```bash
# Increase timeout in jest.config.js
testTimeout: 60000
```

**E2E tests can't connect to development server**
```bash
# Ensure dev server is running
npm run dev
# Then run E2E tests in another terminal
npm run test:e2e
```

### Test Environment Issues

**Mock services not working**
- Check environment variables in `tests/env.setup.js`
- Verify mock setup in `tests/setup.js`
- Ensure `NODE_ENV=test` is set

**Database connection errors**
- Use in-memory SQLite for tests
- Check `TEST_DATABASE_URL` configuration
- Verify Supabase mocking is enabled

## Test Maintenance

### Regular Tasks

1. **Update test data monthly**
   - Review category test inputs
   - Update webhook endpoints
   - Refresh API response mocks

2. **Review performance benchmarks**
   - Update timing expectations
   - Validate accuracy targets
   - Monitor test execution time

3. **Security test updates**
   - Add new attack vectors
   - Update validation tests
   - Review sanitization coverage

4. **Browser compatibility**
   - Update Playwright browsers
   - Test new browser versions
   - Verify mobile compatibility

### Adding New Tests

When adding features:

1. **Create unit tests first**
   - Test core logic in isolation
   - Mock external dependencies
   - Cover error scenarios

2. **Add integration tests**
   - Test feature end-to-end
   - Validate data flow
   - Test with other features

3. **Include E2E tests for UI**
   - Test user interactions
   - Validate accessibility
   - Test responsive design

4. **Update test data**
   - Add new test cases
   - Update mock responses
   - Document test scenarios

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Testing](https://playwright.dev/docs/intro)
- [Testing Library](https://testing-library.com/docs/)
- [Test Plan Document](./TEST_PLAN.md)

## Support

For testing issues:
1. Check this guide first
2. Review test logs and artifacts
3. Run tests with debug mode
4. Create an issue with test failure details