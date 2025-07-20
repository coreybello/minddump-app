import { NextRequest, NextResponse } from 'next/server'
import {
  composeMiddleware,
  withRateLimit,
  withSecurityHeaders,
  withLogging,
  withContentTypeValidation,
  withSizeLimit,
  withErrorHandling,
  RequestValidator,
  ValidationSchema,
  APIError
} from '@/lib/api-security'
import { 
  validateIncomingWebhook, 
  verifyWebhookSignature,
  validateTimestamp 
} from '@/lib/webhook-security'
import { processThoughtWebhook } from '@/lib/webhooks'

// Validation schema for incoming webhook requests
const webhookSchema: ValidationSchema = {
  input: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 10000,
    sanitize: true
  },
  category: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 100,
    sanitize: true
  },
  subcategory: {
    type: 'string',
    required: false,
    maxLength: 100,
    sanitize: true
  },
  priority: {
    type: 'string',
    required: false,
    pattern: /^(low|medium|high)$/i,
    sanitize: true
  },
  timestamp: {
    type: 'string',
    required: true,
    sanitize: true
  },
  expanded: {
    type: 'string',
    required: false,
    maxLength: 50000,
    sanitize: true
  },
  signature: {
    type: 'string',
    required: false,
    sanitize: true
  },
  nonce: {
    type: 'string',
    required: false,
    sanitize: true
  }
}

// Strict rate limiting for webhook endpoint: 30 requests per minute
const webhookRateLimit = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  // Enhanced webhook security validation
  const webhookValidation = validateIncomingWebhook(request, {
    secret: process.env.WEBHOOK_SECRET,
    validateTimestamp: true,
    timestampToleranceMs: 300000 // 5 minutes
  })

  if (!webhookValidation.isValid) {
    throw new APIError(
      'Webhook security validation failed',
      403,
      'WEBHOOK_SECURITY_FAILED',
      { errors: webhookValidation.errors }
    )
  }

  let requestBody: unknown
  
  try {
    requestBody = await request.json()
  } catch (_error) {
    throw new APIError('Invalid JSON in request body', 400, 'INVALID_JSON')
  }

  // Validate and sanitize webhook payload
  const validation = RequestValidator.validateSchema(requestBody, webhookSchema)
  
  if (!validation.isValid) {
    throw new APIError(
      'Webhook payload validation failed',
      400,
      'VALIDATION_ERROR',
      { errors: validation.errors }
    )
  }

  const { 
    input, 
    category, 
    subcategory, 
    priority, 
    timestamp, 
    expanded, 
    signature 
  } = validation.sanitized as {
    input: string
    category: string
    subcategory?: string
    priority?: string
    timestamp: string
    expanded?: string
    signature?: string
  }

  // Verify timestamp to prevent replay attacks
  if (!validateTimestamp(timestamp, 300000)) {
    throw new APIError(
      'Invalid or expired timestamp',
      400,
      'INVALID_TIMESTAMP'
    )
  }

  // Verify webhook signature if secret is configured
  if (process.env.WEBHOOK_SECRET && signature) {
    const payloadString = JSON.stringify({
      input,
      category,
      subcategory,
      priority,
      timestamp,
      expanded
    })
    
    const isValidSignature = verifyWebhookSignature(
      payloadString,
      signature,
      process.env.WEBHOOK_SECRET
    )
    
    if (!isValidSignature) {
      throw new APIError(
        'Invalid webhook signature',
        403,
        'INVALID_SIGNATURE'
      )
    }
  } else if (process.env.WEBHOOK_SECRET && !signature) {
    throw new APIError(
      'Webhook signature required',
      403,
      'MISSING_SIGNATURE'
    )
  }

  // Log webhook receipt
  console.log(`📥 Secure webhook received: ${category} - ${input.substring(0, 100)}...`)

  // Create thought analysis object for processing
  const thoughtAnalysis = {
    type: category.toLowerCase(),
    summary: input,
    expandedThought: expanded,
    urgency: priority?.toLowerCase() || 'medium',
    sentiment: 'neutral' // Default sentiment
  }

  try {
    // Process the webhook using existing webhook system
    await processThoughtWebhook(input, thoughtAnalysis)
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      category,
      timestamp: new Date().toISOString(),
      receivedAt: timestamp
    }, { status: 200 })

  } catch (error) {
    console.error('Webhook processing error:', error)
    throw new APIError(
      'Failed to process webhook',
      500,
      'PROCESSING_FAILED',
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  // Webhook endpoint status and configuration info
  const url = new URL(request.url)
  const includeConfig = url.searchParams.get('config') === 'true'
  
  const status = {
    endpoint: 'active',
    timestamp: new Date().toISOString(),
    security: {
      rateLimited: true,
      signatureRequired: !!process.env.WEBHOOK_SECRET,
      timestampValidation: true,
      maxPayloadSize: '1MB'
    }
  }

  // Include configuration details if requested and authorized
  if (includeConfig) {
    // Only show config in development or with proper authorization
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        ...status,
        config: {
          acceptedMethods: ['POST'],
          requiredHeaders: ['Content-Type'],
          optionalHeaders: ['X-Webhook-Signature', 'X-Webhook-Timestamp'],
          payloadSchema: {
            input: 'string (required, 1-10000 chars)',
            category: 'string (required, 1-100 chars)', 
            subcategory: 'string (optional, max 100 chars)',
            priority: 'string (optional, low|medium|high)',
            timestamp: 'string (required, ISO format)',
            expanded: 'string (optional, max 50000 chars)',
            signature: 'string (optional, HMAC-SHA256 hex)'
          }
        }
      })
    } else {
      throw new APIError('Configuration access denied', 403, 'ACCESS_DENIED')
    }
  }

  return NextResponse.json(status)
}

// Apply comprehensive security middleware
export const POST = composeMiddleware(
  withErrorHandling,
  withLogging,
  withSecurityHeaders,
  withRateLimit(webhookRateLimit),
  withContentTypeValidation(['application/json']),
  withSizeLimit(1024 * 1024) // 1MB limit for webhooks
)(handlePOST)

export const GET = composeMiddleware(
  withErrorHandling,
  withLogging,
  withSecurityHeaders,
  withRateLimit({ windowMs: 60 * 1000, maxRequests: 60 })
)(handleGET)

// Only allow POST and GET methods
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Signature, X-Webhook-Timestamp'
    }
  })
}