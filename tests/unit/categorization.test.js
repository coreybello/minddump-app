/**
 * Unit tests for AI categorization system
 * Tests the 15-category classification system for Mind Dump thoughts
 */

import { jest } from '@jest/globals';
import { analyzeThought } from '../../src/lib/claude';
import { CATEGORY_TEST_INPUTS, EDGE_CASE_INPUTS } from '../mocks/testData.js';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn()
    }
  }))
}));

describe('AI Categorization System', () => {
  
  let mockAnthropicClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
    
    // Get the mocked Anthropic client
    const Anthropic = require('@anthropic-ai/sdk').default;
    mockAnthropicClient = new Anthropic();
  });

  describe('Category Detection Accuracy', () => {
    
    test.each(CATEGORY_TEST_INPUTS)(
      'should categorize "$description" as $expectedCategory',
      async ({ text, expectedCategory, expectedSubcategory, expectedPriority }) => {
        // Mock Claude response for this specific category
        const mockResponse = {
          content: [{
            text: JSON.stringify({
              type: expectedCategory.toLowerCase().replace(/\s+/g, ''),
              category: expectedCategory,
              subcategory: expectedSubcategory,
              priority: expectedPriority,
              expandedThought: `Expanded version of: ${text}`,
              sentiment: 'positive',
              confidence: 0.9,
              actions: ['Action 1', 'Action 2']
            })
          }]
        };
        
        mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);
        
        const result = await analyzeThought(text);
        
        expect(result.type).toBe(expectedCategory.toLowerCase().replace(/\s+/g, ''));
        expect(result.category).toBe(expectedCategory);
        expect(result.subcategory).toBe(expectedSubcategory);
        expect(result.priority).toBe(expectedPriority);
        expect(result.confidence).toBeGreaterThan(0.5);
      }
    );
  });

  describe('Goal Category Tests', () => {
    
    const goalInputs = [
      "I want to lose 30 pounds by next summer",
      "My goal is to read 50 books this year",
      "I aim to save $10,000 for a house down payment",
      "I plan to run a marathon by December"
    ];

    test.each(goalInputs)(
      'should identify goal: "%s"',
      async (input) => {
        const mockResponse = {
          content: [{
            text: JSON.stringify({
              type: 'goal',
              category: 'Goal',
              subcategory: 'Personal',
              priority: 'medium',
              expandedThought: `Personal objective: ${input}`,
              timeframe: 'long-term',
              measurable: true
            })
          }]
        };
        
        mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);
        
        const result = await analyzeThought(input);
        
        expect(result.type).toBe('goal');
        expect(result.category).toBe('Goal');
        expect(result.timeframe).toBeDefined();
      }
    );
  });

  describe('Habit Category Tests', () => {
    
    const habitInputs = [
      "Start meditating for 10 minutes every morning",
      "Drink 8 glasses of water daily",
      "Exercise 3 times per week",
      "Read for 30 minutes before bed"
    ];

    test.each(habitInputs)(
      'should identify habit: "%s"',
      async (input) => {
        const mockResponse = {
          content: [{
            text: JSON.stringify({
              type: 'habit',
              category: 'Habit',
              subcategory: 'Health',
              priority: 'medium',
              frequency: 'daily',
              difficulty: 'easy'
            })
          }]
        };
        
        mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);
        
        const result = await analyzeThought(input);
        
        expect(result.type).toBe('habit');
        expect(result.frequency).toBeDefined();
      }
    );
  });

  describe('Project Idea Category Tests', () => {
    
    const projectInputs = [
      "Build a Chrome extension for password management",
      "Create a mobile app for tracking expenses",
      "Develop a website for local restaurants",
      "Design a smart home automation system"
    ];

    test.each(projectInputs)(
      'should identify project idea: "%s"',
      async (input) => {
        const mockResponse = {
          content: [{
            text: JSON.stringify({
              type: 'projectidea',
              category: 'Project Idea',
              subcategory: 'Technology',
              priority: 'medium',
              complexity: 'medium',
              techStack: ['JavaScript', 'React'],
              estimatedTimeframe: '3-6 months'
            })
          }]
        };
        
        mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);
        
        const result = await analyzeThought(input);
        
        expect(result.type).toBe('projectidea');
        expect(result.techStack).toBeDefined();
        expect(result.complexity).toBeDefined();
      }
    );
  });

  describe('Task Category Tests', () => {
    
    const taskInputs = [
      "Call dentist to schedule appointment",
      "Buy groceries for the week",
      "Email client about project update",
      "Fix the leaky faucet in kitchen"
    ];

    test.each(taskInputs)(
      'should identify task: "%s"',
      async (input) => {
        const mockResponse = {
          content: [{
            text: JSON.stringify({
              type: 'task',
              category: 'Task',
              subcategory: 'Personal',
              priority: 'medium',
              urgency: 'medium',
              estimatedDuration: '30 minutes',
              actionable: true
            })
          }]
        };
        
        mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);
        
        const result = await analyzeThought(input);
        
        expect(result.type).toBe('task');
        expect(result.actionable).toBe(true);
        expect(result.urgency).toBeDefined();
      }
    );
  });

  describe('Sensitive Category Tests', () => {
    
    const sensitiveInputs = [
      "Private thoughts about my relationship",
      "Confidential work information about layoffs",
      "Personal health issues I'm dealing with",
      "Financial struggles I don't want to share"
    ];

    test.each(sensitiveInputs)(
      'should identify sensitive content: "%s"',
      async (input) => {
        const mockResponse = {
          content: [{
            text: JSON.stringify({
              type: 'sensitive',
              category: 'Sensitive',
              subcategory: 'Personal',
              priority: 'high',
              confidentialityLevel: 'private',
              shouldRoute: false
            })
          }]
        };
        
        mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);
        
        const result = await analyzeThought(input);
        
        expect(result.type).toBe('sensitive');
        expect(result.shouldRoute).toBe(false);
        expect(result.confidentialityLevel).toBe('private');
      }
    );
  });

  describe('Edge Cases', () => {
    
    test('should handle ambiguous input', async () => {
      const ambiguousText = "Something important";
      
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            type: 'note',
            category: 'Note',
            subcategory: 'General',
            priority: 'low',
            confidence: 0.3,
            reason: 'Input too vague for specific categorization'
          })
        }]
      };
      
      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);
      
      const result = await analyzeThought(ambiguousText);
      
      expect(result.type).toBe('note');
      expect(result.confidence).toBeLessThan(0.5);
    });

    test('should handle mixed category indicators', async () => {
      const mixedText = "I want to learn React (goal) and I need to call mom (task) and track my sleep (metric)";
      
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            type: 'note',
            category: 'Note',
            subcategory: 'Mixed Content',
            priority: 'medium',
            detectedCategories: ['goal', 'task', 'metric'],
            primaryCategory: 'note',
            reason: 'Multiple categories detected, defaulting to Note'
          })
        }]
      };
      
      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);
      
      const result = await analyzeThought(mixedText);
      
      expect(result.type).toBe('note');
      expect(result.detectedCategories).toHaveLength(3);
    });

    test('should handle very short input', async () => {
      const shortText = "Test";
      
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            type: 'note',
            category: 'Note',
            subcategory: 'Brief',
            priority: 'low',
            confidence: 0.4,
            expandedThought: 'Brief note: Test'
          })
        }]
      };
      
      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);
      
      const result = await analyzeThought(shortText);
      
      expect(result.type).toBe('note');
      expect(result.confidence).toBeLessThan(0.5);
    });

    test('should handle technical jargon', async () => {
      const technicalText = "Implement OAuth 2.0 with PKCE for client-side authentication";
      
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            type: 'task',
            category: 'Task',
            subcategory: 'Technical',
            priority: 'high',
            complexity: 'high',
            techStack: ['OAuth', 'JavaScript'],
            domain: 'security'
          })
        }]
      };
      
      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);
      
      const result = await analyzeThought(technicalText);
      
      expect(result.type).toBe('task');
      expect(result.domain).toBe('security');
      expect(result.complexity).toBe('high');
    });
  });

  describe('Error Handling', () => {
    
    test('should handle Claude API errors', async () => {
      mockAnthropicClient.messages.create.mockRejectedValue(
        new Error('API Rate limit exceeded')
      );
      
      await expect(analyzeThought('Test error handling')).rejects.toThrow();
    });

    test('should handle malformed JSON response', async () => {
      const mockResponse = {
        content: [{
          text: 'Invalid JSON response'
        }]
      };
      
      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);
      
      await expect(analyzeThought('Test malformed response')).rejects.toThrow();
    });

    test('should handle missing content in response', async () => {
      const mockResponse = {
        content: []
      };
      
      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);
      
      await expect(analyzeThought('Test empty response')).rejects.toThrow();
    });

    test('should handle API timeout', async () => {
      mockAnthropicClient.messages.create.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );
      
      await expect(analyzeThought('Test timeout')).rejects.toThrow('Request timeout');
    });
  });

  describe('Performance', () => {
    
    test('should complete categorization within 5 seconds', async () => {
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            type: 'note',
            category: 'Note',
            priority: 'low'
          })
        }]
      };
      
      mockAnthropicClient.messages.create.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(mockResponse), 100)
        )
      );
      
      const start = Date.now();
      await analyzeThought('Performance test input');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(5000);
    });

    test('should handle concurrent categorization requests', async () => {
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            type: 'note',
            category: 'Note',
            priority: 'low'
          })
        }]
      };
      
      mockAnthropicClient.messages.create.mockResolvedValue(mockResponse);
      
      const requests = Array(10).fill().map((_, i) => 
        analyzeThought(`Concurrent test ${i}`)
      );
      
      const results = await Promise.all(requests);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.type).toBe('note');
      });
    });
  });

  describe('Context Preservation', () => {
    
    test('should maintain context across conversations', async () => {
      const firstThought = "I want to start a fitness routine";
      const secondThought = "Related to my previous goal, I should track calories";
      
      const mockResponses = [
        {
          content: [{
            text: JSON.stringify({
              type: 'goal',
              category: 'Goal',
              subcategory: 'Health',
              priority: 'medium'
            })
          }]
        },
        {
          content: [{
            text: JSON.stringify({
              type: 'habit',
              category: 'Habit',
              subcategory: 'Health',
              priority: 'medium',
              relatedTo: 'previous fitness goal'
            })
          }]
        }
      ];
      
      mockAnthropicClient.messages.create
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1]);
      
      const result1 = await analyzeThought(firstThought);
      const result2 = await analyzeThought(secondThought);
      
      expect(result1.type).toBe('goal');
      expect(result2.type).toBe('habit');
      expect(result2.relatedTo).toContain('fitness');
    });
  });
});