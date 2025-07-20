// Test data for Mind Dump app testing

export const CATEGORY_TEST_INPUTS = [
  {
    id: 'goal-1',
    text: "I want to lose 20 pounds by summer and get into the best shape of my life",
    expectedCategory: "Goal",
    expectedSubcategory: "Health & Fitness",
    expectedPriority: "Medium",
    description: "Clear personal health goal with timeline"
  },
  {
    id: 'habit-1',
    text: "Start meditating for 10 minutes every morning before checking my phone",
    expectedCategory: "Habit",
    expectedSubcategory: "Wellness",
    expectedPriority: "Medium",
    description: "Daily routine establishment"
  },
  {
    id: 'project-1',
    text: "Build a Chrome extension that automatically tracks my expenses from bank emails",
    expectedCategory: "Project Idea",
    expectedSubcategory: "Web Development",
    expectedPriority: "Medium",
    description: "Technical project with clear scope"
  },
  {
    id: 'task-1',
    text: "Call dentist to schedule cleaning appointment for next month",
    expectedCategory: "Task",
    expectedSubcategory: "Personal",
    expectedPriority: "Low",
    description: "Simple actionable task"
  },
  {
    id: 'reminder-1',
    text: "Pick up dry cleaning on Thursday before 6 PM",
    expectedCategory: "Reminder",
    expectedSubcategory: "Errands",
    expectedPriority: "Medium",
    description: "Time-specific reminder"
  },
  {
    id: 'note-1',
    text: "Found an interesting article about AI in healthcare, bookmark for later reading",
    expectedCategory: "Note",
    expectedSubcategory: "Reference",
    expectedPriority: "Low",
    description: "Information capture"
  },
  {
    id: 'insight-1',
    text: "I realize I'm most productive between 9-11 AM when I have my morning coffee",
    expectedCategory: "Insight",
    expectedSubcategory: "Personal Optimization",
    expectedPriority: "Low",
    description: "Self-awareness observation"
  },
  {
    id: 'learning-1',
    text: "Learn TypeScript to improve my React development skills",
    expectedCategory: "Learning",
    expectedSubcategory: "Programming",
    expectedPriority: "Medium",
    description: "Skill development goal"
  },
  {
    id: 'career-1',
    text: "Apply for senior developer positions at tech companies in Austin",
    expectedCategory: "Career",
    expectedSubcategory: "Job Search",
    expectedPriority: "High",
    description: "Career advancement action"
  },
  {
    id: 'metric-1',
    text: "Slept 7.5 hours last night, woke up refreshed, energy level 8/10",
    expectedCategory: "Metric",
    expectedSubcategory: "Health Tracking",
    expectedPriority: "Low",
    description: "Personal data logging"
  },
  {
    id: 'idea-1',
    text: "What if we could predict weather patterns using social media sentiment analysis?",
    expectedCategory: "Idea",
    expectedSubcategory: "Innovation",
    expectedPriority: "Low",
    description: "Creative brainstorming"
  },
  {
    id: 'system-1',
    text: "Need a better framework for organizing my daily tasks and priorities",
    expectedCategory: "System",
    expectedSubcategory: "Productivity",
    expectedPriority: "Medium",
    description: "Process improvement"
  },
  {
    id: 'automation-1',
    text: "Automate my weekly expense report generation using Google Sheets API",
    expectedCategory: "Automation",
    expectedSubcategory: "Technical",
    expectedPriority: "High",
    description: "Specific automation need"
  },
  {
    id: 'person-1',
    text: "Meeting with Sarah tomorrow about the new project requirements",
    expectedCategory: "Person",
    expectedSubcategory: "Work",
    expectedPriority: "Medium",
    description: "People-related note"
  },
  {
    id: 'sensitive-1',
    text: "Private thoughts about family financial situation - needs careful handling",
    expectedCategory: "Sensitive",
    expectedSubcategory: "Personal",
    expectedPriority: "High",
    description: "Sensitive personal information"
  }
];

export const EDGE_CASE_INPUTS = [
  {
    id: 'empty',
    text: "",
    expectedError: "VALIDATION_ERROR",
    description: "Empty input should be rejected"
  },
  {
    id: 'too-long',
    text: "a".repeat(50001), // Exceeds 50k character limit
    expectedError: "VALIDATION_ERROR",
    description: "Input exceeding maximum length"
  },
  {
    id: 'ambiguous',
    text: "Do something",
    expectedCategory: "Uncategorized",
    description: "Vague input that's hard to categorize"
  },
  {
    id: 'mixed-categories',
    text: "I want to learn React (goal) and I need to call my mom today (task) and also track my sleep (metric)",
    expectedCategory: "Note", // Should default to Note for mixed content
    description: "Input containing multiple category indicators"
  },
  {
    id: 'special-chars',
    text: "Test with émojis 🚀 and spëcial charåcters & symbols @#$%",
    expectedCategory: "Note",
    description: "Input with special characters and emojis"
  }
];

export const VOICE_INPUT_TEST_CASES = [
  {
    id: 'voice-clear',
    audioFile: null, // Would contain mock audio data
    expectedTranscript: "I want to start exercising every morning",
    expectedCategory: "Habit",
    description: "Clear speech recognition test"
  },
  {
    id: 'voice-noisy',
    audioFile: null,
    expectedTranscript: "Schedule meeting with team",
    expectedCategory: "Task",
    description: "Speech recognition with background noise"
  }
];

export const WEBHOOK_TEST_ENDPOINTS = {
  Goal: "https://webhook.site/test-goal-123",
  Habit: "https://webhook.site/test-habit-123",
  ProjectIdea: "https://webhook.site/test-project-123",
  Task: "https://webhook.site/test-task-123",
  Reminder: "https://webhook.site/test-reminder-123",
  Note: "https://webhook.site/test-note-123",
  Insight: "https://webhook.site/test-insight-123",
  Learning: "https://webhook.site/test-learning-123",
  Career: "https://webhook.site/test-career-123",
  Metric: "https://webhook.site/test-metric-123",
  Idea: "https://webhook.site/test-idea-123",
  System: "https://webhook.site/test-system-123",
  Automation: "https://webhook.site/test-automation-123",
  Person: "https://webhook.site/test-person-123",
  Sensitive: "https://webhook.site/test-sensitive-123"
};

export const EXPECTED_WEBHOOK_PAYLOAD = {
  input: "I want to build a Chrome extension for expense tracking",
  category: "Project Idea",
  subcategory: "Web Development",
  priority: "Medium",
  timestamp: "2025-07-20T18:00:00Z",
  expanded: "Create a Chrome browser extension that automatically detects and categorizes expenses from bank emails and receipts",
  actions: [
    "Research Chrome extension development",
    "Design user interface mockups",
    "Set up development environment",
    "Implement expense detection logic"
  ],
  metadata: {
    thoughtId: "thought_123456789_abc123",
    sentiment: "positive",
    confidence: 0.92
  }
};

export const GOOGLE_SHEETS_TEST_DATA = {
  spreadsheetTitle: "Mind Dump - Project Ideas - 2025-07-20",
  headers: [
    "Raw Input",
    "Category", 
    "Subcategory",
    "Priority",
    "Expanded Text",
    "Timestamp",
    "Actions",
    "Sentiment",
    "Thought ID"
  ],
  sampleRow: [
    "Build a Chrome extension for expense tracking",
    "Project Idea",
    "Web Development", 
    "Medium",
    "Create a Chrome browser extension that automatically detects and categorizes expenses from bank emails and receipts",
    "2025-07-20T18:00:00Z",
    "Research Chrome extension development, Design user interface mockups",
    "positive",
    "thought_123456789_abc123"
  ]
};

export const PERFORMANCE_TEST_CONFIG = {
  concurrent_users: [1, 5, 10, 25, 50, 100],
  test_duration: "60s",
  ramp_up_time: "30s",
  scenarios: [
    {
      name: "text_input_load",
      weight: 70,
      requests_per_second: 10
    },
    {
      name: "voice_input_load", 
      weight: 20,
      requests_per_second: 3
    },
    {
      name: "category_override_load",
      weight: 10,
      requests_per_second: 2
    }
  ]
};

export const SECURITY_TEST_PAYLOADS = [
  {
    name: "XSS Script Injection",
    payload: {
      text: "<script>alert('XSS')</script>I want to learn JavaScript"
    },
    expectedBehavior: "Script tags should be sanitized"
  },
  {
    name: "SQL Injection Attempt",
    payload: {
      text: "'; DROP TABLE thoughts; --"
    },
    expectedBehavior: "Should be treated as regular text"
  },
  {
    name: "Oversized Request",
    payload: {
      text: "x".repeat(10000000) // 10MB
    },
    expectedBehavior: "Should be rejected by size limit"
  },
  {
    name: "Invalid JSON",
    payload: "invalid json string",
    expectedBehavior: "Should return 400 Bad Request"
  }
];

export const ACCESSIBILITY_TEST_CHECKLIST = [
  "Keyboard navigation works for all interactive elements",
  "Voice input button has proper ARIA labels", 
  "Category dropdown is accessible via keyboard",
  "Screen reader announces processing states",
  "Color contrast meets WCAG 2.1 AA standards",
  "Focus indicators are visible and clear",
  "Error messages are announced by screen readers",
  "Form validation is accessible"
];

export const BROWSER_COMPATIBILITY_MATRIX = [
  { name: "Chrome", version: "120+", voice: true, expected: "full" },
  { name: "Firefox", version: "119+", voice: false, expected: "limited" },
  { name: "Safari", version: "17+", voice: true, expected: "full" },
  { name: "Edge", version: "120+", voice: true, expected: "full" },
  { name: "Mobile Chrome", version: "120+", voice: true, expected: "full" },
  { name: "Mobile Safari", version: "17+", voice: true, expected: "full" }
];

export const MOCK_API_RESPONSES = {
  claude_success: {
    type: "project",
    title: "Expense Tracking Chrome Extension",
    summary: "A browser extension for automatic expense categorization",
    expandedThought: "Create a Chrome browser extension that automatically detects and categorizes expenses from bank emails and receipts",
    actions: ["Research Chrome extension development", "Design user interface"],
    urgency: "medium",
    sentiment: "positive",
    confidence: 0.92
  },
  claude_error: {
    error: "API_RATE_LIMIT_EXCEEDED",
    message: "Claude API rate limit exceeded",
    retryAfter: 60
  },
  sheets_success: {
    spreadsheetId: "1A2B3C4D5E6F7G8H9I",
    spreadsheetUrl: "https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I/edit",
    sheetId: 0,
    title: "Mind Dump - Project Ideas - 2025-07-20"
  },
  webhook_success: {
    status: "delivered",
    url: "https://webhook.site/test-project-123",
    responseTime: 250,
    responseCode: 200
  }
};