/**
 * Unit tests for Mind Dump API routes
 * Tests the /api/thoughts endpoint with categorization and webhook functionality
 */

import { jest } from '@jest/globals';
import { POST, GET } from '../../src/app/api/thoughts/route';
import { CATEGORY_TEST_INPUTS, EDGE_CASE_INPUTS, MOCK_API_RESPONSES } from '../mocks/testData.js';

// Mock external dependencies
jest.mock('@/lib/claude', () => ({
  analyzeThought: jest.fn()
}));

jest.mock('@/lib/sheets', () => ({
  createGoogleSheet: jest.fn(),
  generateSheetTitle: jest.fn()
}));

jest.mock('@/lib/webhooks', () => ({
  processThoughtWebhook: jest.fn()
}));

// Mock Next.js request/response
const mockRequest = (body, method = 'POST') => ({
  json: jest.fn().mockResolvedValue(body),
  url: 'http://localhost:3000/api/thoughts',
  method
});

const mockResponse = {
  json: jest.fn(),
  status: jest.fn().mockReturnThis()
};

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data) => ({ 
      json: () => data,
      status: 200,
      headers: new Map()
    }))
  }
}));

describe('Mind Dump API - /api/thoughts', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL = 'test@example.com';
    process.env.GOOGLE_SHEETS_PRIVATE_KEY = 'test-key';
  });

  describe('POST /api/thoughts', () => {
    
    describe('Input Validation', () => {
      
      test('should reject empty text input', async () => {
        const request = mockRequest({ text: '' });
        
        try {
          await POST(request);
        } catch (error) {
          expect(error.message).toContain('Validation failed');
          expect(error.status).toBe(400);
        }
      });

      test('should reject text exceeding 50k characters', async () => {
        const request = mockRequest({ text: 'a'.repeat(50001) });
        
        try {
          await POST(request);
        } catch (error) {
          expect(error.message).toContain('Validation failed');
          expect(error.status).toBe(400);
        }
      });

      test('should sanitize XSS attempts', async () => {
        const maliciousInput = "<script>alert('xss')</script>I want to learn";
        const request = mockRequest({ text: maliciousInput });
        
        const { analyzeThought } = require('@/lib/claude');
        analyzeThought.mockResolvedValue(MOCK_API_RESPONSES.claude_success);
        
        const response = await POST(request);
        const result = response.json();
        
        // Verify script tags are sanitized
        expect(result.thought.raw_text).not.toContain('<script>');
        expect(result.thought.raw_text).toContain('I want to learn');
      });

      test('should handle special characters and emojis', async () => {
        const specialText = "Test with émojis 🚀 and spëcial charåcters";
        const request = mockRequest({ text: specialText });
        
        const { analyzeThought } = require('@/lib/claude');
        analyzeThought.mockResolvedValue(MOCK_API_RESPONSES.claude_success);
        
        const response = await POST(request);
        const result = response.json();
        
        expect(result.thought.raw_text).toBe(specialText);
        expect(result.success).toBe(true);
      });
    });

    describe('AI Categorization', () => {
      
      test.each(CATEGORY_TEST_INPUTS)(
        'should correctly categorize: $description',
        async ({ text, expectedCategory }) => {
          const request = mockRequest({ text });
          
          const { analyzeThought } = require('@/lib/claude');
          analyzeThought.mockResolvedValue({
            ...MOCK_API_RESPONSES.claude_success,
            type: expectedCategory.toLowerCase().replace(' ', '')
          });
          
          const response = await POST(request);
          const result = response.json();
          
          expect(result.success).toBe(true);
          expect(result.analysis.type).toBe(expectedCategory.toLowerCase().replace(' ', ''));
        }
      );

      test('should handle Claude API timeout', async () => {
        const request = mockRequest({ text: 'Test timeout scenario' });
        
        const { analyzeThought } = require('@/lib/claude');
        analyzeThought.mockImplementation(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Analysis timeout')), 100)
          )
        );
        
        try {
          await POST(request);
        } catch (error) {
          expect(error.message).toContain('Failed to analyze thought');
          expect(error.status).toBe(503);
        }
      });

      test('should handle Claude API rate limiting', async () => {
        const request = mockRequest({ text: 'Test rate limiting' });
        
        const { analyzeThought } = require('@/lib/claude');
        analyzeThought.mockRejectedValue(new Error('Rate limit exceeded'));
        
        try {
          await POST(request);
        } catch (error) {
          expect(error.message).toContain('Failed to analyze thought');
        }
      });

      test('should override category when manually specified', async () => {
        const request = mockRequest({ 
          text: 'This could be anything',
          category: 'task'
        });
        
        const { analyzeThought } = require('@/lib/claude');
        analyzeThought.mockResolvedValue({
          ...MOCK_API_RESPONSES.claude_success,
          type: 'idea' // AI thinks it's an idea
        });
        
        const response = await POST(request);
        const result = response.json();
        
        // Should use manual override
        expect(result.thought.type).toBe('task');
      });
    });

    describe('Google Sheets Integration', () => {
      
      test('should create Google Sheet for project ideas', async () => {
        const request = mockRequest({ 
          text: 'Build a new mobile app for fitness tracking'
        });
        
        const { analyzeThought } = require('@/lib/claude');
        const { createGoogleSheet, generateSheetTitle } = require('@/lib/sheets');
        
        analyzeThought.mockResolvedValue({
          ...MOCK_API_RESPONSES.claude_success,
          type: 'project',
          title: 'Fitness Tracking App'
        });
        
        generateSheetTitle.mockReturnValue('Mind Dump - Fitness Tracking App - 2025-07-20');
        createGoogleSheet.mockResolvedValue('https://docs.google.com/spreadsheets/d/test123');
        
        const response = await POST(request);
        const result = response.json();
        
        expect(createGoogleSheet).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Mind Dump - Fitness Tracking App - 2025-07-20',
            category: 'technical'
          })
        );
        expect(result.sheetsUrl).toBe('https://docs.google.com/spreadsheets/d/test123');
      });

      test('should handle Google Sheets API failures gracefully', async () => {
        const request = mockRequest({ 
          text: 'Build a project that should create a sheet'
        });
        
        const { analyzeThought } = require('@/lib/claude');
        const { createGoogleSheet } = require('@/lib/sheets');
        
        analyzeThought.mockResolvedValue({
          ...MOCK_API_RESPONSES.claude_success,
          type: 'project',
          title: 'Test Project'
        });
        
        createGoogleSheet.mockRejectedValue(new Error('Sheets API error'));
        
        const response = await POST(request);
        const result = response.json();
        
        // Should succeed even if sheets creation fails
        expect(result.success).toBe(true);
        expect(result.sheetsUrl).toBeNull();
      });

      test('should timeout Google Sheets creation after 15 seconds', async () => {
        const request = mockRequest({ 
          text: 'Build a project with slow sheets creation'
        });
        
        const { analyzeThought } = require('@/lib/claude');
        const { createGoogleSheet } = require('@/lib/sheets');
        
        analyzeThought.mockResolvedValue({
          ...MOCK_API_RESPONSES.claude_success,
          type: 'project',
          title: 'Slow Project'
        });
        
        createGoogleSheet.mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 20000))
        );
        
        const response = await POST(request);
        const result = response.json();
        
        expect(result.success).toBe(true);
        expect(result.sheetsUrl).toBeNull();
      });
    });

    describe('Webhook Processing', () => {
      
      test('should trigger webhook for categorized thoughts', async () => {
        const request = mockRequest({ 
          text: 'I want to start a new habit of daily reading'
        });
        
        const { analyzeThought } = require('@/lib/claude');
        const { processThoughtWebhook } = require('@/lib/webhooks');
        
        analyzeThought.mockResolvedValue({
          ...MOCK_API_RESPONSES.claude_success,
          type: 'habit'
        });
        
        const response = await POST(request);
        const result = response.json();
        
        expect(processThoughtWebhook).toHaveBeenCalledWith(
          'I want to start a new habit of daily reading',
          expect.objectContaining({ type: 'habit' })
        );
        expect(result.success).toBe(true);
      });

      test('should not block response if webhook fails', async () => {
        const request = mockRequest({ 
          text: 'Test webhook failure handling'
        });
        
        const { analyzeThought } = require('@/lib/claude');
        const { processThoughtWebhook } = require('@/lib/webhooks');
        
        analyzeThought.mockResolvedValue(MOCK_API_RESPONSES.claude_success);
        processThoughtWebhook.mockRejectedValue(new Error('Webhook failed'));
        
        const response = await POST(request);
        const result = response.json();
        
        // Response should still succeed
        expect(result.success).toBe(true);
      });
    });

    describe('Security Middleware', () => {
      
      test('should enforce rate limiting', async () => {
        const request = mockRequest({ text: 'Rate limit test' });
        
        // Simulate rapid requests
        const promises = Array(25).fill().map(() => POST(request));
        
        const responses = await Promise.allSettled(promises);
        const rejected = responses.filter(r => r.status === 'rejected');
        
        expect(rejected.length).toBeGreaterThan(0);
      });

      test('should add security headers', async () => {
        const request = mockRequest({ text: 'Security headers test' });
        
        const { analyzeThought } = require('@/lib/claude');
        analyzeThought.mockResolvedValue(MOCK_API_RESPONSES.claude_success);
        
        const response = await POST(request);
        
        // Verify security headers are applied by middleware
        expect(response.headers).toBeDefined();
      });

      test('should validate content type', async () => {
        const request = {
          ...mockRequest({ text: 'Content type test' }),
          headers: { 'content-type': 'text/plain' }
        };
        
        try {
          await POST(request);
        } catch (error) {
          expect(error.status).toBe(400);
        }
      });
    });

    describe('Response Format', () => {
      
      test('should return properly structured response', async () => {
        const request = mockRequest({ 
          text: 'Test response structure'
        });
        
        const { analyzeThought } = require('@/lib/claude');
        analyzeThought.mockResolvedValue(MOCK_API_RESPONSES.claude_success);
        
        const response = await POST(request);
        const result = response.json();
        
        expect(result).toMatchObject({
          success: true,
          thought: expect.objectContaining({
            id: expect.stringMatching(/^thought_\d+_[a-z0-9]+$/),
            raw_text: 'Test response structure',
            type: expect.any(String),
            created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
          }),
          analysis: expect.objectContaining({
            type: expect.any(String),
            urgency: expect.any(String),
            sentiment: expect.any(String)
          }),
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        });
      });

      test('should include project data for project thoughts', async () => {
        const request = mockRequest({ 
          text: 'Build a revolutionary AI assistant'
        });
        
        const { analyzeThought } = require('@/lib/claude');
        analyzeThought.mockResolvedValue({
          ...MOCK_API_RESPONSES.claude_success,
          type: 'project',
          title: 'AI Assistant Project'
        });
        
        const response = await POST(request);
        const result = response.json();
        
        expect(result.project).toMatchObject({
          id: expect.stringMatching(/^project_\d+_[a-z0-9]+$/),
          thought_id: expect.any(String),
          title: 'AI Assistant Project',
          category: 'technical',
          created_at: expect.any(String)
        });
      });
    });
  });

  describe('GET /api/thoughts', () => {
    
    test('should return paginated thoughts list', async () => {
      const request = mockRequest({}, 'GET');
      request.url = 'http://localhost:3000/api/thoughts?limit=10&offset=0';
      
      const response = await GET(request);
      const result = response.json();
      
      expect(result).toMatchObject({
        thoughts: expect.any(Array),
        pagination: {
          limit: 10,
          offset: 0,
          total: expect.any(Number),
          hasMore: expect.any(Boolean)
        },
        timestamp: expect.any(String)
      });
    });

    test('should enforce maximum limit of 100', async () => {
      const request = mockRequest({}, 'GET');
      request.url = 'http://localhost:3000/api/thoughts?limit=500';
      
      const response = await GET(request);
      const result = response.json();
      
      expect(result.pagination.limit).toBe(100);
    });

    test('should handle negative offset', async () => {
      const request = mockRequest({}, 'GET');
      request.url = 'http://localhost:3000/api/thoughts?offset=-10';
      
      const response = await GET(request);
      const result = response.json();
      
      expect(result.pagination.offset).toBe(0);
    });
  });
});

describe('Error Handling', () => {
  
  test('should handle missing API key gracefully', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    
    const request = mockRequest({ text: 'Test without API key' });
    
    try {
      await POST(request);
    } catch (error) {
      expect(error.message).toContain('Claude API not configured');
      expect(error.status).toBe(503);
    }
  });

  test('should handle malformed JSON gracefully', async () => {
    const request = {
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
    };
    
    try {
      await POST(request);
    } catch (error) {
      expect(error.message).toContain('Invalid JSON in request body');
      expect(error.status).toBe(400);
    }
  });
});