/**
 * API Documentation Endpoint
 * Provides comprehensive API documentation in OpenAPI format
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  composeMiddleware,
  withRateLimit,
  withSecurityHeaders,
  withLogging,
  withErrorHandling
} from '@/lib/api-security'

// Rate limiting for documentation - higher limits since it's read-only
const docsRateLimit = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100
}

const API_DOCUMENTATION = {
  openapi: '3.0.3',
  info: {
    title: 'MindDump API',
    description: 'API for processing and analyzing thoughts with AI-powered insights',
    version: '1.0.0',
    contact: {
      name: 'MindDump Support',
      url: 'https://github.com/your-repo/minddump'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      description: 'Production server'
    },
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  security: [
    {
      apiKey: []
    }
  ],
  paths: {
    '/api/thoughts': {
      post: {
        summary: 'Create and analyze a thought',
        description: 'Submit a raw thought for AI analysis and processing. The system will categorize the thought, extract action items, and expand on ideas.',
        tags: ['Thoughts'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: {
                    type: 'string',
                    description: 'The raw thought text to analyze',
                    minLength: 1,
                    maxLength: 50000,
                    example: 'I want to build a mobile app for tracking daily habits'
                  },
                  category: {
                    type: 'string',
                    description: 'Optional category override',
                    enum: ['auto-detect', 'idea', 'task', 'project', 'vent', 'reflection'],
                    example: 'project'
                  },
                  analysis: {
                    type: 'object',
                    description: 'Pre-computed analysis (for subscription mode)',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['idea', 'task', 'project', 'vent', 'reflection']
                      },
                      title: { type: 'string' },
                      summary: { type: 'string' },
                      actions: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      expandedThought: { type: 'string' },
                      urgency: {
                        type: 'string',
                        enum: ['low', 'medium', 'high']
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Thought successfully processed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    thought: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'thought_1234567890_abc123' },
                        raw_text: { type: 'string' },
                        type: { type: 'string', enum: ['idea', 'task', 'project', 'vent', 'reflection'] },
                        expanded_text: { type: 'string' },
                        actions: {
                          type: 'array',
                          items: { type: 'string' }
                        },
                        created_at: { type: 'string', format: 'date-time' }
                      }
                    },
                    project: {
                      type: 'object',
                      nullable: true,
                      description: 'Project details if thought is categorized as a project',
                      properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        summary: { type: 'string' },
                        readme: { type: 'string', nullable: true },
                        overview: { type: 'string', nullable: true },
                        sheets_url: { type: 'string', nullable: true },
                        tech_stack: {
                          type: 'array',
                          items: { type: 'string' }
                        },
                        features: {
                          type: 'array',
                          items: { type: 'string' }
                        }
                      }
                    },
                    analysis: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        title: { type: 'string' },
                        summary: { type: 'string' },
                        urgency: { type: 'string', enum: ['low', 'medium', 'high'] },
                        sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] }
                      }
                    },
                    sheetsUrl: { type: 'string', nullable: true },
                    actionsCreated: { type: 'number' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Validation failed' },
                    code: { type: 'string', example: 'VALIDATION_ERROR' },
                    details: {
                      type: 'object',
                      properties: {
                        errors: {
                          type: 'array',
                          items: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          429: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Too many requests' },
                    retryAfter: { type: 'number', example: 60 }
                  }
                }
              }
            }
          },
          503: {
            description: 'Service unavailable (Claude API not configured)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Claude API not configured' },
                    code: { type: 'string', example: 'SERVICE_UNAVAILABLE' }
                  }
                }
              }
            }
          }
        }
      },
      get: {
        summary: 'Retrieve thoughts',
        description: 'Get a list of stored thoughts with pagination',
        tags: ['Thoughts'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Number of thoughts to return (max 100)',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 50
            }
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of thoughts to skip',
            schema: {
              type: 'integer',
              minimum: 0,
              default: 0
            }
          }
        ],
        responses: {
          200: {
            description: 'Thoughts retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    thoughts: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          raw_text: { type: 'string' },
                          type: { type: 'string' },
                          created_at: { type: 'string', format: 'date-time' }
                        }
                      }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        limit: { type: 'number' },
                        offset: { type: 'number' },
                        total: { type: 'number' },
                        hasMore: { type: 'boolean' }
                      }
                    },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/health': {
      get: {
        summary: 'System health check',
        description: 'Check the health status of the API and its dependencies',
        tags: ['System'],
        parameters: [
          {
            name: 'detailed',
            in: 'query',
            description: 'Include detailed metrics and diagnostics',
            schema: {
              type: 'boolean',
              default: false
            }
          },
          {
            name: 'metrics',
            in: 'query',
            description: 'Include performance metrics (requires detailed=true)',
            schema: {
              type: 'boolean',
              default: false
            }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Simple status check only',
            schema: {
              type: 'boolean',
              default: false
            }
          }
        ],
        responses: {
          200: {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string' },
                    environment: { type: 'string' },
                    checks: {
                      type: 'object',
                      properties: {
                        api: { type: 'boolean' },
                        claude: { type: 'boolean' },
                        googleSheets: { type: 'boolean' },
                        memory: { type: 'boolean' },
                        performance: {
                          type: 'object',
                          properties: {
                            responseTime: { type: 'number' },
                            memoryUsage: { type: 'object' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          206: {
            description: 'System is degraded but functional'
          },
          503: {
            description: 'System is unhealthy'
          }
        }
      },
      head: {
        summary: 'Simple availability check',
        description: 'Quick check if the API is responding',
        tags: ['System'],
        responses: {
          200: {
            description: 'API is available'
          }
        }
      }
    },
    '/auth/callback': {
      get: {
        summary: 'OAuth callback handler',
        description: 'Handle OAuth authentication callbacks from Supabase',
        tags: ['Authentication'],
        parameters: [
          {
            name: 'code',
            in: 'query',
            description: 'Authorization code from OAuth provider',
            schema: { type: 'string' }
          },
          {
            name: 'error',
            in: 'query',
            description: 'Error code if authentication failed',
            schema: { type: 'string' }
          }
        ],
        responses: {
          302: {
            description: 'Redirect to application or error page'
          },
          400: {
            description: 'Invalid request parameters'
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'API key for authentication (currently not required)'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          details: { type: 'object' }
        }
      }
    }
  },
  tags: [
    {
      name: 'Thoughts',
      description: 'Operations for managing and analyzing thoughts'
    },
    {
      name: 'System',
      description: 'System health and monitoring endpoints'
    },
    {
      name: 'Authentication',
      description: 'Authentication and authorization endpoints'
    }
  ]
}

async function handleDocs(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const format = url.searchParams.get('format') || 'json'
  
  if (format === 'yaml') {
    // For YAML format, we'd need a YAML library
    // For now, return JSON with appropriate content type
    return NextResponse.json(API_DOCUMENTATION, {
      headers: {
        'Content-Type': 'application/x-yaml'
      }
    })
  }
  
  if (format === 'html') {
    // Generate HTML documentation
    const htmlDoc = generateHTMLDoc()
    return new NextResponse(htmlDoc, {
      headers: {
        'Content-Type': 'text/html'
      }
    })
  }
  
  // Default JSON format
  return NextResponse.json(API_DOCUMENTATION)
}

function generateHTMLDoc(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MindDump API Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .endpoint { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 3px; color: white; font-weight: bold; }
        .post { background: #4CAF50; }
        .get { background: #2196F3; }
        .head { background: #FF9800; }
        .description { margin: 10px 0; color: #666; }
        .schema { background: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace; }
        .security { background: #fff3cd; padding: 10px; border-radius: 3px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>MindDump API Documentation</h1>
    <p>API for processing and analyzing thoughts with AI-powered insights</p>
    
    <div class="security">
        <h3>🔒 Security Features</h3>
        <ul>
            <li>Rate limiting (20-100 requests per minute depending on endpoint)</li>
            <li>Input validation and sanitization</li>
            <li>Security headers (XSS protection, content type sniffing protection)</li>
            <li>Request size limits (5MB for thoughts, 10MB general)</li>
            <li>Content-type validation</li>
            <li>IP-based rate limiting</li>
        </ul>
    </div>

    <h2>Endpoints</h2>
    
    <div class="endpoint">
        <h3><span class="method post">POST</span> /api/thoughts</h3>
        <p class="description">Create and analyze a thought with AI-powered insights</p>
        <div class="schema">
Request Body:
{
  "text": "I want to build a mobile app for habit tracking",
  "category": "project" (optional),
  "analysis": {...} (optional, for pre-computed analysis)
}

Response:
{
  "success": true,
  "thought": {...},
  "project": {...} (if applicable),
  "analysis": {...},
  "actionsCreated": 3
}
        </div>
    </div>

    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/thoughts</h3>
        <p class="description">Retrieve stored thoughts with pagination</p>
        <div class="schema">
Query Parameters:
- limit: Number of thoughts (max 100, default 50)
- offset: Number to skip (default 0)

Response:
{
  "thoughts": [],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 0,
    "hasMore": false
  }
}
        </div>
    </div>

    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/health</h3>
        <p class="description">System health check and diagnostics</p>
        <div class="schema">
Query Parameters:
- detailed: Include detailed metrics (boolean)
- metrics: Include performance metrics (boolean)
- status: Simple status only (boolean)

Response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "checks": {
    "api": true,
    "claude": true,
    "googleSheets": true,
    "memory": true
  }
}
        </div>
    </div>

    <h2>Error Codes</h2>
    <ul>
        <li><strong>400</strong> - Validation Error</li>
        <li><strong>413</strong> - Request Too Large</li>
        <li><strong>415</strong> - Unsupported Content Type</li>
        <li><strong>429</strong> - Rate Limit Exceeded</li>
        <li><strong>503</strong> - Service Unavailable</li>
    </ul>

    <h2>Rate Limits</h2>
    <ul>
        <li><strong>API Routes:</strong> 100 requests per minute</li>
        <li><strong>Auth Routes:</strong> 20 requests per minute</li>
        <li><strong>Thoughts POST:</strong> 20 requests per minute</li>
        <li><strong>Thoughts GET:</strong> 60 requests per minute</li>
    </ul>

    <p><a href="/api/docs?format=json">View OpenAPI JSON</a></p>
</body>
</html>`
}

export const GET = composeMiddleware(
  withErrorHandling,
  withLogging,
  withSecurityHeaders,
  withRateLimit(docsRateLimit)
)(handleDocs)