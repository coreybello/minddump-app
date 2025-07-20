/**
 * Unit tests for webhook processing system
 * Tests webhook routing for all 15 categories and payload generation
 */

import { jest } from '@jest/globals';
import { processThoughtWebhook, WEBHOOK_ENDPOINTS } from '../../src/lib/webhooks';
import { WEBHOOK_TEST_ENDPOINTS, EXPECTED_WEBHOOK_PAYLOAD } from '../mocks/testData.js';

// Mock fetch for webhook requests
global.fetch = jest.fn();

describe('Webhook Processing System', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful webhook response
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ received: true }),
      headers: new Map([['content-type', 'application/json']])
    });
  });

  describe('Webhook URL Mapping', () => {
    
    test('should have webhook URLs for all 15 categories', () => {
      const expectedCategories = [
        'Goal', 'Habit', 'ProjectIdea', 'Task', 'Reminder',
        'Note', 'Insight', 'Learning', 'Career', 'Metric',
        'Idea', 'System', 'Automation', 'Person', 'Sensitive'
      ];
      
      expectedCategories.forEach(category => {
        expect(WEBHOOK_ENDPOINTS[category]).toBeDefined();
        expect(WEBHOOK_ENDPOINTS[category]).toMatch(/^https?:\/\//);
      });
    });

    test('should handle case-insensitive category matching', async () => {
      const thoughtAnalysis = {
        type: 'goal', // lowercase
        title: 'Test Goal',
        expandedThought: 'Expanded goal text'
      };
      
      await processThoughtWebhook('Test goal input', thoughtAnalysis);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('goal'),
        expect.any(Object)
      );
    });

    test('should handle ProjectIdea category name mapping', async () => {
      const thoughtAnalysis = {
        type: 'projectidea',
        title: 'Test Project',
        expandedThought: 'Expanded project text'
      };
      
      await processThoughtWebhook('Test project input', thoughtAnalysis);
      
      expect(global.fetch).toHaveBeenCalledWith(
        WEBHOOK_ENDPOINTS.ProjectIdea,
        expect.any(Object)
      );
    });
  });

  describe('Webhook Payload Generation', () => {
    
    test('should generate correct payload structure', async () => {
      const inputText = "I want to build a Chrome extension for expense tracking";
      const analysis = {
        type: 'projectidea',
        title: 'Expense Tracking Extension',
        summary: 'Chrome extension for automatic expense categorization',
        expandedThought: 'Create a Chrome browser extension that automatically detects and categorizes expenses',
        actions: ['Research Chrome extension development', 'Design user interface'],
        urgency: 'medium',
        sentiment: 'positive',
        subcategory: 'Web Development'
      };
      
      await processThoughtWebhook(inputText, analysis);
      
      expect(global.fetch).toHaveBeenCalledWith(
        WEBHOOK_ENDPOINTS.ProjectIdea,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': expect.stringContaining('MindDump'),
            'Authorization': expect.any(String)
          }),
          body: expect.stringMatching(/^\{.*\}$/) // Valid JSON
        })
      );
      
      // Parse the body to verify payload structure
      const call = global.fetch.mock.calls[0];
      const payload = JSON.parse(call[1].body);
      
      expect(payload).toMatchObject({
        input: inputText,
        category: 'Project Idea',
        subcategory: 'Web Development',
        priority: 'medium',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        expanded: analysis.expandedThought,
        actions: analysis.actions,
        metadata: expect.objectContaining({
          thoughtId: expect.stringMatching(/^thought_\d+_[a-z0-9]+$/),
          sentiment: 'positive'
        })
      });
    });

    test('should handle missing optional fields gracefully', async () => {
      const inputText = "Simple test";
      const analysis = {
        type: 'note'
        // Missing optional fields
      };
      
      await processThoughtWebhook(inputText, analysis);
      
      const call = global.fetch.mock.calls[0];
      const payload = JSON.parse(call[1].body);
      
      expect(payload).toMatchObject({
        input: inputText,
        category: 'Note',
        subcategory: 'General',
        priority: 'low',
        expanded: inputText, // Falls back to input
        actions: [],
        metadata: expect.any(Object)
      });
    });

    test('should sanitize payload data', async () => {
      const inputText = "<script>alert('xss')</script>Malicious input";
      const analysis = {
        type: 'note',
        expandedThought: "<script>alert('xss2')</script>Malicious expanded"
      };
      
      await processThoughtWebhook(inputText, analysis);
      
      const call = global.fetch.mock.calls[0];
      const payload = JSON.parse(call[1].body);
      
      expect(payload.input).not.toContain('<script>');
      expect(payload.expanded).not.toContain('<script>');
      expect(payload.input).toContain('Malicious input');
    });

    test('should limit action array length', async () => {
      const inputText = "Test with many actions";
      const analysis = {
        type: 'task',
        actions: Array(100).fill('Action item') // Too many actions
      };
      
      await processThoughtWebhook(inputText, analysis);
      
      const call = global.fetch.mock.calls[0];
      const payload = JSON.parse(call[1].body);
      
      expect(payload.actions).toHaveLength(50); // Should be limited to 50
    });

    test('should truncate long text fields', async () => {
      const inputText = "a".repeat(100000); // Very long input
      const analysis = {
        type: 'note',
        expandedThought: "b".repeat(200000) // Very long expanded text
      };
      
      await processThoughtWebhook(inputText, analysis);
      
      const call = global.fetch.mock.calls[0];
      const payload = JSON.parse(call[1].body);
      
      expect(payload.input.length).toBeLessThanOrEqual(50000);
      expect(payload.expanded.length).toBeLessThanOrEqual(100000);
    });
  });

  describe('Category-Specific Routing', () => {
    
    const categoryTests = [
      { type: 'goal', expectedCategory: 'Goal', webhook: WEBHOOK_ENDPOINTS.Goal },
      { type: 'habit', expectedCategory: 'Habit', webhook: WEBHOOK_ENDPOINTS.Habit },
      { type: 'projectidea', expectedCategory: 'Project Idea', webhook: WEBHOOK_ENDPOINTS.ProjectIdea },
      { type: 'task', expectedCategory: 'Task', webhook: WEBHOOK_ENDPOINTS.Task },
      { type: 'reminder', expectedCategory: 'Reminder', webhook: WEBHOOK_ENDPOINTS.Reminder },
      { type: 'note', expectedCategory: 'Note', webhook: WEBHOOK_ENDPOINTS.Note },
      { type: 'insight', expectedCategory: 'Insight', webhook: WEBHOOK_ENDPOINTS.Insight },
      { type: 'learning', expectedCategory: 'Learning', webhook: WEBHOOK_ENDPOINTS.Learning },
      { type: 'career', expectedCategory: 'Career', webhook: WEBHOOK_ENDPOINTS.Career },
      { type: 'metric', expectedCategory: 'Metric', webhook: WEBHOOK_ENDPOINTS.Metric },
      { type: 'idea', expectedCategory: 'Idea', webhook: WEBHOOK_ENDPOINTS.Idea },
      { type: 'system', expectedCategory: 'System', webhook: WEBHOOK_ENDPOINTS.System },
      { type: 'automation', expectedCategory: 'Automation', webhook: WEBHOOK_ENDPOINTS.Automation },
      { type: 'person', expectedCategory: 'Person', webhook: WEBHOOK_ENDPOINTS.Person },
      { type: 'sensitive', expectedCategory: 'Sensitive', webhook: WEBHOOK_ENDPOINTS.Sensitive }
    ];

    test.each(categoryTests)(
      'should route $type to correct webhook',
      async ({ type, expectedCategory, webhook }) => {
        const analysis = { type };
        
        await processThoughtWebhook(`Test ${type} input`, analysis);
        
        expect(global.fetch).toHaveBeenCalledWith(
          webhook,
          expect.any(Object)
        );
        
        const call = global.fetch.mock.calls[0];
        const payload = JSON.parse(call[1].body);
        expect(payload.category).toBe(expectedCategory);
      }
    );
  });

  describe('Sensitive Content Handling', () => {
    
    test('should process sensitive content with special handling', async () => {
      const inputText = "Private family financial information";
      const analysis = {
        type: 'sensitive',
        confidentialityLevel: 'private'
      };
      
      await processThoughtWebhook(inputText, analysis);
      
      const call = global.fetch.mock.calls[0];
      const payload = JSON.parse(call[1].body);
      
      expect(payload.category).toBe('Sensitive');
      expect(payload.metadata.confidentialityLevel).toBe('private');
      expect(call[1].headers['X-Sensitive-Content']).toBe('true');
    });

    test('should add warning headers for sensitive content', async () => {
      const analysis = { type: 'sensitive' };
      
      await processThoughtWebhook('Sensitive test', analysis);
      
      const call = global.fetch.mock.calls[0];
      expect(call[1].headers['X-Sensitive-Content']).toBe('true');
      expect(call[1].headers['X-Content-Warning']).toBe('Contains sensitive information');
    });
  });

  describe('Error Handling', () => {
    
    test('should handle webhook timeout', async () => {
      global.fetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );
      
      const analysis = { type: 'note' };
      
      // Should not throw, but handle gracefully
      await expect(processThoughtWebhook('Test timeout', analysis)).resolves.not.toThrow();
    });

    test('should handle webhook server errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      const analysis = { type: 'task' };
      
      await expect(processThoughtWebhook('Test server error', analysis)).resolves.not.toThrow();
    });

    test('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      const analysis = { type: 'goal' };
      
      await expect(processThoughtWebhook('Test network error', analysis)).resolves.not.toThrow();
    });

    test('should handle unknown category types', async () => {
      const analysis = { type: 'unknowncategory' };
      
      await processThoughtWebhook('Test unknown category', analysis);
      
      // Should not make any webhook calls for unknown categories
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should retry failed webhook calls', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ received: true })
        });
      
      const analysis = { type: 'task' };
      
      await processThoughtWebhook('Test retry logic', analysis);
      
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Performance', () => {
    
    test('should complete webhook processing within 10 seconds', async () => {
      global.fetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            json: async () => ({ received: true })
          }), 1000)
        )
      );
      
      const start = Date.now();
      await processThoughtWebhook('Performance test', { type: 'note' });
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(10000);
    });

    test('should handle concurrent webhook processing', async () => {
      const requests = Array(10).fill().map((_, i) => 
        processThoughtWebhook(`Concurrent test ${i}`, { type: 'note' })
      );
      
      await Promise.all(requests);
      
      expect(global.fetch).toHaveBeenCalledTimes(10);
    });

    test('should enforce request timeout', async () => {
      // Mock a very slow response
      global.fetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(resolve, 30000) // 30 seconds
        )
      );
      
      const start = Date.now();
      await processThoughtWebhook('Timeout test', { type: 'task' });
      const duration = Date.now() - start;
      
      // Should timeout before 30 seconds
      expect(duration).toBeLessThan(15000);
    });
  });

  describe('Security', () => {
    
    test('should include authentication headers', async () => {
      await processThoughtWebhook('Security test', { type: 'note' });
      
      const call = global.fetch.mock.calls[0];
      expect(call[1].headers['Authorization']).toBeDefined();
      expect(call[1].headers['X-API-Key']).toBeDefined();
    });

    test('should include security headers', async () => {
      await processThoughtWebhook('Security headers test', { type: 'task' });
      
      const call = global.fetch.mock.calls[0];
      expect(call[1].headers['X-Requested-With']).toBe('MindDumpApp');
      expect(call[1].headers['User-Agent']).toContain('MindDump');
    });

    test('should validate webhook URLs', async () => {
      // Mock invalid webhook URL
      const originalWebhook = WEBHOOK_ENDPOINTS.Note;
      WEBHOOK_ENDPOINTS.Note = 'invalid-url';
      
      await processThoughtWebhook('Invalid URL test', { type: 'note' });
      
      // Should not attempt to call invalid URL
      expect(global.fetch).not.toHaveBeenCalled();
      
      // Restore original URL
      WEBHOOK_ENDPOINTS.Note = originalWebhook;
    });

    test('should prevent request forgery', async () => {
      await processThoughtWebhook('CSRF test', { type: 'goal' });
      
      const call = global.fetch.mock.calls[0];
      expect(call[1].headers['X-CSRF-Token']).toBeDefined();
      expect(call[1].headers['Origin']).toBeDefined();
    });
  });

  describe('Webhook Response Handling', () => {
    
    test('should handle successful webhook responses', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ 
          received: true, 
          processedAt: '2025-07-20T18:00:00Z',
          webhookId: 'webhook_123'
        })
      });
      
      const result = await processThoughtWebhook('Success test', { type: 'habit' });
      
      expect(result).toMatchObject({
        success: true,
        status: 200,
        webhookId: 'webhook_123'
      });
    });

    test('should handle webhook response with custom headers', async () => {
      const customHeaders = new Map([
        ['X-Webhook-ID', 'webhook_456'],
        ['X-Processing-Time', '250ms']
      ]);
      
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: customHeaders,
        json: async () => ({ received: true })
      });
      
      const result = await processThoughtWebhook('Custom headers test', { type: 'learning' });
      
      expect(result.webhookId).toBe('webhook_456');
      expect(result.processingTime).toBe('250ms');
    });
  });
});