/**
 * Jest test setup file
 * Global configuration and mocks for all tests
 */

import '@testing-library/jest-dom';
import 'whatwg-fetch'; // Polyfill for fetch in Node.js

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
}));

// Mock Web Speech API
global.webkitSpeechRecognition = jest.fn(() => ({
  continuous: false,
  interimResults: false,
  lang: '',
  start: jest.fn(),
  stop: jest.fn(),
  onstart: null,
  onresult: null,
  onerror: null,
  onend: null,
}));

global.SpeechRecognition = global.webkitSpeechRecognition;

// Mock crypto for secure ID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => '12345678-1234-1234-1234-123456789abc',
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    // Suppress specific React/Next.js warnings in tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: Each child in a list should have a unique'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    // Suppress specific warnings in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
global.testUtils = {
  // Helper to create mock API responses
  createMockApiResponse: (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Map([['content-type', 'application/json']]),
  }),

  // Helper to create mock thought analysis
  createMockAnalysis: (type = 'note', overrides = {}) => ({
    type,
    category: type.charAt(0).toUpperCase() + type.slice(1),
    subcategory: 'General',
    priority: 'medium',
    expandedThought: `Expanded ${type} thought`,
    actions: [`Action for ${type}`],
    urgency: 'medium',
    sentiment: 'neutral',
    confidence: 0.8,
    ...overrides,
  }),

  // Helper to create mock requests
  createMockRequest: (body, headers = {}) => ({
    json: async () => body,
    text: async () => JSON.stringify(body),
    headers: new Map(Object.entries({
      'content-type': 'application/json',
      ...headers,
    })),
  }),

  // Helper to wait for async operations
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to trigger mock speech recognition
  triggerMockSpeechRecognition: (transcript, recognition) => {
    if (recognition.onstart) recognition.onstart();
    
    setTimeout(() => {
      if (recognition.onresult) {
        const mockEvent = {
          resultIndex: 0,
          results: [{
            isFinal: true,
            0: { transcript }
          }]
        };
        recognition.onresult(mockEvent);
      }
    }, 100);
    
    setTimeout(() => {
      if (recognition.onend) recognition.onend();
    }, 200);
  },
};

// Global test data
global.TEST_DATA = {
  sampleThoughts: [
    'I want to learn React development',
    'Call dentist for appointment',
    'Build a Chrome extension for productivity',
    'Start exercising every morning',
    'Private thoughts about family'
  ],
  
  sampleCategories: [
    'goal', 'task', 'projectidea', 'habit', 'sensitive'
  ],
  
  sampleWebhookUrls: {
    goal: 'https://webhook.site/test-goal',
    task: 'https://webhook.site/test-task',
    projectidea: 'https://webhook.site/test-project'
  }
};

// Test environment validation
if (process.env.NODE_ENV !== 'test') {
  console.warn('Jest setup running outside of test environment');
}

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset any global state
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
  
  // Clean up DOM
  document.body.innerHTML = '';
  
  // Clean up any timers
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});