import { NextRequest, NextResponse } from 'next/server'
import {
  composeMiddleware,
  withRateLimit,
  withSecurityHeaders,
  withLogging,
  withErrorHandling,
  APIError
} from '@/lib/api-security'
import { validateWebhookSecurity, getWebhookSecurityStatus } from '@/lib/webhooks'
import { secureSheets } from '@/lib/sheets-security'

// Rate limiting for security validation endpoint: 10 requests per minute
const securityValidationRateLimit = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const detailed = url.searchParams.get('detailed') === 'true'
  
  try {
    // Basic security status
    const webhookStatus = getWebhookSecurityStatus()
    const webhookValidation = validateWebhookSecurity()
    
    const basicStatus = {
      timestamp: new Date().toISOString(),
      overall: 'checking',
      components: {
        webhooks: {
          enabled: webhookStatus.enabled,
          configured: webhookStatus.urlsConfigured > 0,
          secure: webhookStatus.hasSecret && webhookValidation.isValid
        },
        sheets: {
          configured: !!(process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY),
          secure: !!(process.env.SHEETS_ENCRYPTION_KEY)
        },
        api: {
          rateLimited: true,
          securityHeaders: true,
          inputValidation: true
        }
      }
    }

    // Determine overall security status
    const allComponentsSecure = Object.values(basicStatus.components).every(component => 
      typeof component === 'object' && 'secure' in component ? component.secure : true
    )
    
    basicStatus.overall = allComponentsSecure ? 'secure' : 'needs_attention'

    if (!detailed) {
      return NextResponse.json(basicStatus)
    }

    // Detailed security validation (only in development or with proper auth)
    if (process.env.NODE_ENV !== 'development') {
      throw new APIError('Detailed security info requires development environment', 403, 'ACCESS_DENIED')
    }

    // Perform comprehensive security validation
    const sheetsValidation = await secureSheets.validateSecurity()
    
    const detailedStatus = {
      ...basicStatus,
      detailed: {
        webhooks: {
          ...webhookValidation,
          status: webhookStatus,
          recommendations: []
        },
        sheets: {
          ...sheetsValidation,
          recommendations: []
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasRequiredSecrets: {
            webhookSecret: !!process.env.WEBHOOK_SECRET,
            sheetsEncryption: !!process.env.SHEETS_ENCRYPTION_KEY,
            anthropicApi: !!process.env.ANTHROPIC_API_KEY,
            sheetsCredentials: !!(process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY)
          }
        }
      }
    }

    // Generate security recommendations
    if (!webhookStatus.hasSecret) {
      detailedStatus.detailed.webhooks.recommendations.push('Set WEBHOOK_SECRET environment variable (min 32 characters)')
    }
    
    if (webhookStatus.placeholderUrls > 0) {
      detailedStatus.detailed.webhooks.recommendations.push(`Replace ${webhookStatus.placeholderUrls} placeholder webhook URLs with real endpoints`)
    }
    
    if (!process.env.SHEETS_ENCRYPTION_KEY) {
      detailedStatus.detailed.sheets.recommendations.push('Set SHEETS_ENCRYPTION_KEY for sensitive data encryption')
    }
    
    if (process.env.NODE_ENV === 'production') {
      if (webhookValidation.warnings.length > 0) {
        detailedStatus.detailed.webhooks.recommendations.push(...webhookValidation.warnings)
      }
      if (sheetsValidation.warnings.length > 0) {
        detailedStatus.detailed.sheets.recommendations.push(...sheetsValidation.warnings)
      }
    }

    return NextResponse.json(detailedStatus)

  } catch (error) {
    console.error('Security validation error:', error)
    throw new APIError(
      'Security validation failed',
      500,
      'VALIDATION_ERROR',
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  // Security test endpoint - only available in development
  if (process.env.NODE_ENV !== 'development') {
    throw new APIError('Security testing only available in development', 403, 'ACCESS_DENIED')
  }

  let requestBody: unknown
  
  try {
    requestBody = await request.json()
  } catch (_error) {
    throw new APIError('Invalid JSON in request body', 400, 'INVALID_JSON')
  }

  const { testType } = requestBody as { testType?: string }

  if (!testType) {
    throw new APIError('Test type required', 400, 'MISSING_TEST_TYPE')
  }

  const results: Record<string, unknown> = {
    testType,
    timestamp: new Date().toISOString(),
    results: {}
  }

  try {
    switch (testType) {
      case 'webhook_validation':
        const webhookValidation = validateWebhookSecurity()
        results.results = webhookValidation
        break

      case 'sheets_validation':
        const sheetsValidation = await secureSheets.validateSecurity()
        results.results = sheetsValidation
        break

      case 'environment_check':
        results.results = {
          requiredVariables: {
            WEBHOOK_SECRET: !!process.env.WEBHOOK_SECRET,
            SHEETS_ENCRYPTION_KEY: !!process.env.SHEETS_ENCRYPTION_KEY,
            GOOGLE_SHEETS_CLIENT_EMAIL: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
            GOOGLE_SHEETS_PRIVATE_KEY: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
            ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
            MASTER_SHEET_ID: !!process.env.MASTER_SHEET_ID
          },
          variableValidation: {
            webhookSecretLength: process.env.WEBHOOK_SECRET?.length || 0,
            masterSheetIdFormat: process.env.MASTER_SHEET_ID ? 
              /^[a-zA-Z0-9-_]{44}$/.test(process.env.MASTER_SHEET_ID) : false
          }
        }
        break

      default:
        throw new APIError('Unknown test type', 400, 'UNKNOWN_TEST_TYPE')
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error(`Security test '${testType}' failed:`, error)
    throw new APIError(
      `Security test failed: ${testType}`,
      500,
      'TEST_FAILED',
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    )
  }
}

// Apply security middleware
export const GET = composeMiddleware(
  withErrorHandling,
  withLogging,
  withSecurityHeaders,
  withRateLimit(securityValidationRateLimit)
)(handleGET)

export const POST = composeMiddleware(
  withErrorHandling,
  withLogging,
  withSecurityHeaders,
  withRateLimit(securityValidationRateLimit)
)(handlePOST)

// Health check for security systems
export async function HEAD(request: NextRequest) {
  const isHealthy = !!(
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
    process.env.GOOGLE_SHEETS_PRIVATE_KEY &&
    process.env.ANTHROPIC_API_KEY
  )

  return new NextResponse(null, {
    status: isHealthy ? 200 : 503,
    headers: {
      'X-Security-Status': isHealthy ? 'healthy' : 'degraded',
      'X-Timestamp': new Date().toISOString()
    }
  })
}