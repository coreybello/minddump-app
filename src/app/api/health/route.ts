/**
 * API Health Check Endpoint
 * Provides system health monitoring and diagnostics
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  composeMiddleware,
  withRateLimit,
  withSecurityHeaders,
  withLogging,
  withErrorHandling
} from '@/lib/api-security'

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  checks: {
    api: boolean
    claude: boolean
    googleSheets: boolean
    memory: boolean
    performance: {
      responseTime: number
      memoryUsage: NodeJS.MemoryUsage
    }
  }
  errors?: string[]
}

// Rate limiting for health checks - moderate limits
const healthRateLimit = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30
}

async function handleHealthCheck(_request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  const errors: string[] = []
  
  const checks = {
    api: true, // If we're here, API is responding
    claude: false,
    googleSheets: false,
    memory: true,
    performance: {
      responseTime: 0,
      memoryUsage: process.memoryUsage()
    }
  }

  // Check Claude API availability
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      checks.claude = true
    } else {
      errors.push('Claude API key not configured')
    }
  } catch (_error) {
    errors.push('Claude API check failed')
    checks.claude = false
  }

  // Check Google Sheets API availability
  try {
    if (process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      checks.googleSheets = true
    } else {
      errors.push('Google Sheets credentials not configured')
    }
  } catch (_error) {
    errors.push('Google Sheets check failed')
    checks.googleSheets = false
  }

  // Memory check
  const memoryUsage = process.memoryUsage()
  const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024
  const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024
  const memoryUsagePercent = (heapUsedMB / heapTotalMB) * 100

  if (memoryUsagePercent > 90) {
    errors.push('High memory usage detected')
    checks.memory = false
  }

  // Calculate response time
  checks.performance.responseTime = Date.now() - startTime
  checks.performance.memoryUsage = memoryUsage

  // Determine overall health status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  
  if (!checks.claude || !checks.googleSheets) {
    status = 'degraded'
  }
  
  if (!checks.memory || checks.performance.responseTime > 5000) {
    status = 'unhealthy'
  }

  const result: HealthCheckResult = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
    ...(errors.length > 0 && { errors })
  }

  // Return appropriate status code based on health
  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 206 : 503

  return NextResponse.json(result, { status: statusCode })
}

// Detailed health check with more diagnostics
async function handleDetailedHealthCheck(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  const url = new URL(request.url)
  const includeMetrics = url.searchParams.get('metrics') === 'true'
  
  const basicHealth = await handleHealthCheck(request)
  const healthData = await basicHealth.json() as HealthCheckResult

  if (!includeMetrics) {
    return basicHealth
  }

  // Additional metrics for detailed health check
  const additionalMetrics = {
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime(),
      pid: process.pid
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      hasGoogleCreds: !!(process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    performance: {
      ...healthData.checks.performance,
      detailedResponseTime: Date.now() - startTime,
      eventLoopDelay: await measureEventLoopDelay()
    }
  }

  const detailedResult = {
    ...healthData,
    metrics: additionalMetrics
  }

  const statusCode = healthData.status === 'healthy' ? 200 : healthData.status === 'degraded' ? 206 : 503
  return NextResponse.json(detailedResult, { status: statusCode })
}

// Measure event loop delay
async function measureEventLoopDelay(): Promise<number> {
  const start = process.hrtime()
  
  return new Promise((resolve) => {
    setImmediate(() => {
      const delta = process.hrtime(start)
      const nanosec = delta[0] * 1e9 + delta[1]
      resolve(nanosec / 1e6) // Convert to milliseconds
    })
  })
}

// Status endpoint (simple)
async function handleStatus(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'minddump-api'
  })
}

// Route handlers
export const GET = composeMiddleware(
  withErrorHandling,
  withLogging,
  withSecurityHeaders,
  withRateLimit(healthRateLimit)
)(async (request: NextRequest) => {
  const url = new URL(request.url)
  const detailed = url.searchParams.get('detailed') === 'true'
  const status = url.searchParams.get('status') === 'true'
  
  if (status) {
    return handleStatus(request)
  }
  
  if (detailed) {
    return handleDetailedHealthCheck(request)
  }
  
  return handleHealthCheck(request)
})

// HEAD request for simple availability check
export const HEAD = composeMiddleware(
  withErrorHandling,
  withSecurityHeaders,
  withRateLimit(healthRateLimit)
)(async (_request: NextRequest) => {
  return new NextResponse(null, { status: 200 })
})