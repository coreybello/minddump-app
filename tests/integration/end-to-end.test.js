/**
 * Integration tests for complete Mind Dump workflow
 * Tests the full flow from input to categorization to webhook and Google Sheets
 */

import { jest } from '@jest/globals';
import { createRequest, createResponse } from 'node-mocks-http';
import { POST } from '../../src/app/api/thoughts/route';
import { CATEGORY_TEST_INPUTS } from '../mocks/testData.js';

// Mock external services
jest.mock('@anthropic-ai/sdk');
jest.mock('googleapis');

describe('Mind Dump End-to-End Integration', () => {
  
  let mockAnthropicClient;
  let mockGoogleSheets;
  let mockWebhookResponse;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL = 'test@serviceaccount.iam.gserviceaccount.com';
    process.env.GOOGLE_SHEETS_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----';
    
    // Mock Anthropic client
    const Anthropic = require('@anthropic-ai/sdk').default;
    mockAnthropicClient = {
      messages: {
        create: jest.fn()
      }
    };
    Anthropic.mockImplementation(() => mockAnthropicClient);
    
    // Mock Google Sheets API
    const { google } = require('googleapis');
    mockGoogleSheets = {
      spreadsheets: {
        create: jest.fn(),
        values: {
          append: jest.fn()
        }
      }
    };
    google.sheets.mockReturnValue(mockGoogleSheets);
    google.auth.JWT.mockImplementation(() => ({
      authorize: jest.fn().mockResolvedValue(true)
    }));
    
    // Mock webhook responses
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ received: true })
    });
  });

  describe('Complete Workflow Tests', () => {
    
    test('should process goal input end-to-end', async () => {
      const inputText = "I want to lose 20 pounds by summer";
      
      // Mock Claude response
      mockAnthropicClient.messages.create.mockResolvedValue({
        content: [{
          text: JSON.stringify({
            type: 'goal',
            category: 'Goal',
            subcategory: 'Health & Fitness',
            priority: 'medium',
            expandedThought: 'Personal health and fitness goal to lose 20 pounds by summer season',
            actions: ['Create workout plan', 'Plan healthy meals', 'Track daily progress'],
            urgency: 'medium',
            sentiment: 'positive',
            confidence: 0.92
          })
        }]
      });
      
      const request = createRequest({
        method: 'POST',
        url: '/api/thoughts',
        body: { text: inputText },
        headers: { 'content-type': 'application/json' }
      });
      
      const response = await POST(request);
      const result = response.json();
      
      // Verify API response structure
      expect(result.success).toBe(true);
      expect(result.thought).toMatchObject({
        id: expect.stringMatching(/^thought_\d+_[a-z0-9]+$/),
        raw_text: inputText,
        type: 'goal',
        expanded_text: expect.stringContaining('health and fitness'),
        actions: expect.arrayContaining(['Create workout plan']),
        created_at: expect.any(String)
      });
      
      // Verify analysis
      expect(result.analysis).toMatchObject({
        type: 'goal',
        urgency: 'medium',
        sentiment: 'positive'
      });
      
      // Verify webhook was called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('goal'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining(inputText)
        })
      );
      
      // Verify webhook payload
      const webhookCall = global.fetch.mock.calls[0];
      const webhookPayload = JSON.parse(webhookCall[1].body);
      expect(webhookPayload).toMatchObject({
        input: inputText,
        category: 'Goal',
        subcategory: 'Health & Fitness',
        priority: 'medium',
        expanded: expect.stringContaining('health and fitness'),
        actions: expect.arrayContaining(['Create workout plan'])
      });
    });

    test('should process project idea with Google Sheets creation', async () => {
      const inputText = "Build a Chrome extension for automatic expense tracking";
      
      // Mock Claude response for project
      mockAnthropicClient.messages.create.mockResolvedValue({
        content: [{
          text: JSON.stringify({
            type: 'project',
            title: 'Expense Tracking Chrome Extension',
            summary: 'Browser extension for automatic expense categorization and tracking',
            expandedThought: 'Create a Chrome browser extension that automatically detects and categorizes expenses from bank emails and receipts, providing real-time spending insights',
            actions: [
              'Research Chrome extension development',
              'Design user interface mockups',
              'Implement expense detection algorithms',
              'Set up database for expense storage'
            ],
            urgency: 'medium',
            sentiment: 'positive',
            confidence: 0.88,
            techStack: ['JavaScript', 'Chrome APIs', 'Machine Learning'],
            features: ['Email parsing', 'Receipt scanning', 'Expense categorization', 'Spending analytics'],
            markdown: {
              readme: '# Expense Tracking Extension\n\nAutomatic expense tracking for Chrome.',
              projectOverview: '## Project Overview\n\nThis extension will help users track expenses automatically.'
            }
          })
        }]
      });
      
      // Mock Google Sheets creation
      mockGoogleSheets.spreadsheets.create.mockResolvedValue({
        data: {
          spreadsheetId: '1A2B3C4D5E6F7G8H9I',
          spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I/edit'
        }
      });
      
      const request = createRequest({
        method: 'POST',
        url: '/api/thoughts',
        body: { text: inputText },
        headers: { 'content-type': 'application/json' }
      });
      
      const response = await POST(request);
      const result = response.json();
      
      // Verify thought creation
      expect(result.thought.type).toBe('project');
      expect(result.thought.actions).toHaveLength(4);
      
      // Verify project creation
      expect(result.project).toMatchObject({
        id: expect.stringMatching(/^project_\d+_[a-z0-9]+$/),
        title: 'Expense Tracking Chrome Extension',
        summary: expect.stringContaining('expense categorization'),
        category: 'technical',
        tech_stack: expect.arrayContaining(['JavaScript', 'Chrome APIs']),
        features: expect.arrayContaining(['Email parsing', 'Receipt scanning'])
      });
      
      // Verify Google Sheets creation
      expect(mockGoogleSheets.spreadsheets.create).toHaveBeenCalledWith({
        requestBody: expect.objectContaining({
          properties: expect.objectContaining({
            title: expect.stringContaining('Expense Tracking')
          })
        })
      });
      
      expect(result.sheetsUrl).toBe('https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I/edit');
      
      // Verify webhook for project idea
      const webhookCall = global.fetch.mock.calls[0];
      const webhookPayload = JSON.parse(webhookCall[1].body);
      expect(webhookPayload.category).toBe('Project Idea');
    });

    test('should handle sensitive content with special processing', async () => {
      const inputText = "Private thoughts about my family financial situation";
      
      // Mock Claude response for sensitive content
      mockAnthropicClient.messages.create.mockResolvedValue({
        content: [{
          text: JSON.stringify({
            type: 'sensitive',
            category: 'Sensitive',
            subcategory: 'Personal',
            priority: 'high',
            expandedThought: 'Private personal thoughts regarding family financial matters',
            confidentialityLevel: 'private',
            shouldRoute: false,
            sentiment: 'neutral'
          })
        }]
      });
      
      const request = createRequest({
        method: 'POST',
        url: '/api/thoughts',
        body: { text: inputText },
        headers: { 'content-type': 'application/json' }
      });
      
      const response = await POST(request);
      const result = response.json();
      
      // Verify sensitive processing
      expect(result.thought.type).toBe('sensitive');
      expect(result.analysis.type).toBe('sensitive');
      
      // Verify webhook call includes sensitive headers
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('sensitive'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Sensitive-Content': 'true',
            'X-Content-Warning': 'Contains sensitive information'
          })
        })
      );
      
      // Verify no Google Sheets creation for sensitive content
      expect(mockGoogleSheets.spreadsheets.create).not.toHaveBeenCalled();
    });

    test('should handle multiple categories in single input', async () => {
      const inputText = "I want to learn React (goal) and I need to call mom today (task) and track my sleep (metric)";
      
      // Mock Claude response for mixed content
      mockAnthropicClient.messages.create.mockResolvedValue({
        content: [{
          text: JSON.stringify({
            type: 'note',
            category: 'Note',
            subcategory: 'Mixed Content',
            priority: 'medium',
            expandedThought: 'Note containing multiple types of thoughts: learning goal, personal task, and health metric tracking',
            detectedCategories: ['goal', 'task', 'metric'],
            primaryCategory: 'note',
            actions: ['Break down into separate items', 'Create learning plan', 'Schedule call', 'Set up sleep tracking'],
            sentiment: 'positive'
          })
        }]
      });
      
      const request = createRequest({
        method: 'POST',
        url: '/api/thoughts',
        body: { text: inputText },
        headers: { 'content-type': 'application/json' }
      });
      
      const response = await POST(request);
      const result = response.json();
      
      // Should categorize as Note for mixed content
      expect(result.thought.type).toBe('note');
      expect(result.thought.actions).toHaveLength(4);
      
      // Should route to Note webhook
      const webhookCall = global.fetch.mock.calls[0];
      const webhookPayload = JSON.parse(webhookCall[1].body);
      expect(webhookPayload.category).toBe('Note');
      expect(webhookPayload.metadata.detectedCategories).toEqual(['goal', 'task', 'metric']);
    });

    test('should handle voice input processing', async () => {
      const voiceTranscript = "I want to start exercising every morning at 6 AM";
      
      // Mock Claude response for habit
      mockAnthropicClient.messages.create.mockResolvedValue({
        content: [{
          text: JSON.stringify({
            type: 'habit',
            category: 'Habit',
            subcategory: 'Health & Fitness',
            priority: 'medium',
            expandedThought: 'Daily exercise habit with specific time commitment at 6 AM',
            frequency: 'daily',
            timeOfDay: '6:00 AM',
            difficulty: 'medium',
            actions: ['Set alarm for 5:45 AM', 'Plan workout routine', 'Prepare exercise clothes'],
            sentiment: 'positive'
          })
        }]
      });
      
      const request = createRequest({
        method: 'POST',
        url: '/api/thoughts',
        body: { 
          text: voiceTranscript,
          inputMethod: 'voice' // Simulate voice input
        },
        headers: { 'content-type': 'application/json' }
      });
      
      const response = await POST(request);
      const result = response.json();
      
      // Verify habit processing
      expect(result.thought.type).toBe('habit');
      expect(result.thought.actions).toContain('Set alarm for 5:45 AM');
      
      // Verify webhook includes voice metadata
      const webhookCall = global.fetch.mock.calls[0];
      const webhookPayload = JSON.parse(webhookCall[1].body);
      expect(webhookPayload.category).toBe('Habit');
      expect(webhookPayload.metadata.inputMethod).toBe('voice');
    });
  });

  describe('Error Recovery and Resilience', () => {
    
    test('should continue processing when Google Sheets fails', async () => {
      const inputText = "Build a mobile app for fitness tracking";
      
      // Mock Claude response for project
      mockAnthropicClient.messages.create.mockResolvedValue({
        content: [{
          text: JSON.stringify({
            type: 'project',
            title: 'Fitness Tracking App',
            summary: 'Mobile app for comprehensive fitness tracking',
            expandedThought: 'Comprehensive mobile application for tracking workouts, nutrition, and progress'
          })
        }]
      });
      
      // Mock Google Sheets failure
      mockGoogleSheets.spreadsheets.create.mockRejectedValue(
        new Error('Google Sheets API quota exceeded')
      );
      
      const request = createRequest({
        method: 'POST',
        url: '/api/thoughts',
        body: { text: inputText },
        headers: { 'content-type': 'application/json' }
      });
      
      const response = await POST(request);
      const result = response.json();
      
      // Should still succeed despite Sheets failure
      expect(result.success).toBe(true);
      expect(result.thought.type).toBe('project');
      expect(result.project).toBeDefined();
      expect(result.sheetsUrl).toBeNull();
      
      // Webhook should still be called
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should continue processing when webhook fails', async () => {
      const inputText = "Learn Python programming";
      
      // Mock Claude response
      mockAnthropicClient.messages.create.mockResolvedValue({
        content: [{
          text: JSON.stringify({
            type: 'learning',
            category: 'Learning',
            expandedThought: 'Learning goal to master Python programming language'
          })
        }]
      });
      
      // Mock webhook failure
      global.fetch.mockRejectedValue(new Error('Webhook service unavailable'));
      
      const request = createRequest({
        method: 'POST',
        url: '/api/thoughts',
        body: { text: inputText },
        headers: { 'content-type': 'application/json' }
      });
      
      const response = await POST(request);
      const result = response.json();
      
      // Should still succeed despite webhook failure
      expect(result.success).toBe(true);
      expect(result.thought.type).toBe('learning');
    });

    test('should handle Claude API failures gracefully', async () => {
      const inputText = "Test API failure handling";
      
      // Mock Claude API failure
      mockAnthropicClient.messages.create.mockRejectedValue(
        new Error('Claude API rate limit exceeded')
      );
      
      const request = createRequest({
        method: 'POST',
        url: '/api/thoughts',
        body: { text: inputText },
        headers: { 'content-type': 'application/json' }
      });
      
      // Should throw error for Claude failures
      await expect(POST(request)).rejects.toThrow();
    });
  });

  describe('Performance and Concurrent Processing', () => {
    
    test('should handle concurrent requests efficiently', async () => {
      // Mock Claude responses
      mockAnthropicClient.messages.create.mockImplementation((params) => 
        Promise.resolve({
          content: [{
            text: JSON.stringify({
              type: 'note',
              category: 'Note',
              expandedThought: `Processed: ${params.messages[0].content}`
            })
          }]
        })
      );
      
      // Create multiple concurrent requests
      const requests = Array(5).fill().map((_, i) => {
        const request = createRequest({
          method: 'POST',
          url: '/api/thoughts',
          body: { text: `Concurrent test ${i}` },
          headers: { 'content-type': 'application/json' }
        });
        return POST(request);
      });
      
      const responses = await Promise.all(requests);
      
      // All should succeed
      responses.forEach((response, i) => {
        const result = response.json();
        expect(result.success).toBe(true);
        expect(result.thought.raw_text).toBe(`Concurrent test ${i}`);
      });
      
      // Should have made 5 Claude API calls
      expect(mockAnthropicClient.messages.create).toHaveBeenCalledTimes(5);
      
      // Should have made 5 webhook calls
      expect(global.fetch).toHaveBeenCalledTimes(5);
    });

    test('should complete full workflow within performance targets', async () => {
      const inputText = "Performance test input";
      
      // Mock responses with realistic delays
      mockAnthropicClient.messages.create.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            content: [{
              text: JSON.stringify({
                type: 'note',
                category: 'Note',
                expandedThought: 'Performance test response'
              })
            }]
          }), 1000) // 1 second Claude delay
        )
      );
      
      global.fetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: async () => ({ received: true })
          }), 500) // 500ms webhook delay
        )
      );
      
      const request = createRequest({
        method: 'POST',
        url: '/api/thoughts',
        body: { text: inputText },
        headers: { 'content-type': 'application/json' }
      });
      
      const start = Date.now();
      const response = await POST(request);
      const duration = Date.now() - start;
      
      // Should complete within 5 seconds total
      expect(duration).toBeLessThan(5000);
      expect(response.json().success).toBe(true);
    });
  });

  describe('Data Validation and Sanitization', () => {
    
    test('should sanitize input and maintain data integrity', async () => {
      const maliciousInput = "<script>alert('xss')</script>I want to <b>learn</b> React";
      
      mockAnthropicClient.messages.create.mockResolvedValue({
        content: [{
          text: JSON.stringify({
            type: 'learning',
            category: 'Learning',
            expandedThought: 'Learning goal for React development'
          })
        }]
      });
      
      const request = createRequest({
        method: 'POST',
        url: '/api/thoughts',
        body: { text: maliciousInput },
        headers: { 'content-type': 'application/json' }
      });
      
      const response = await POST(request);
      const result = response.json();
      
      // Verify sanitization
      expect(result.thought.raw_text).not.toContain('<script>');
      expect(result.thought.raw_text).toContain('I want to');
      expect(result.thought.raw_text).toContain('learn');
      expect(result.thought.raw_text).toContain('React');
      
      // Verify webhook payload is also sanitized
      const webhookCall = global.fetch.mock.calls[0];
      const webhookPayload = JSON.parse(webhookCall[1].body);
      expect(webhookPayload.input).not.toContain('<script>');
    });

    test('should enforce length limits across the pipeline', async () => {
      const longInput = 'a'.repeat(60000); // Exceeds 50k limit
      
      const request = createRequest({
        method: 'POST',
        url: '/api/thoughts',
        body: { text: longInput },
        headers: { 'content-type': 'application/json' }
      });
      
      // Should be rejected at validation level
      await expect(POST(request)).rejects.toThrow();
    });
  });
});