import { NextRequest, NextResponse } from 'next/server'
import { getPerformanceHealth } from '@/lib/performance'
import { getClaudePerformanceStats } from '@/lib/claude-optimized'
import { getSheetsPerformanceStats } from '@/lib/sheets-optimized'
import { getWebhookPerformanceStats } from '@/lib/webhooks-optimized'
import {
  composeMiddleware,
  withRateLimit,
  withSecurityHeaders,
  withLogging,
  withErrorHandling
} from '@/lib/api-security'

// Light rate limiting for performance endpoint
const rateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30 // Allow frequent checks
}

async function handleGET(_request: NextRequest): Promise<NextResponse> {
  try {
    // Collect performance metrics from all systems
    const [systemHealth, claudeStats, sheetsStats, webhookStats] = await Promise.allSettled([
      Promise.resolve(getPerformanceHealth()),
      Promise.resolve(getClaudePerformanceStats()),
      Promise.resolve(getSheetsPerformanceStats()),
      Promise.resolve(getWebhookPerformanceStats())
    ])

    // Extract successful results with fallbacks
    const health = systemHealth.status === 'fulfilled' ? systemHealth.value : {
      healthy: false,
      score: 0,
      cacheStats: {},
      queueStats: {},
      monitorStats: {}
    }

    const claude = claudeStats.status === 'fulfilled' ? claudeStats.value : {
      apiCalls: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      categories: []
    }

    const sheets = sheetsStats.status === 'fulfilled' ? sheetsStats.value : {
      batchOperations: 0,
      averageProcessingTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      queueStats: { pending: 0, processing: false }
    }

    const webhooks = webhookStats.status === 'fulfilled' ? webhookStats.value : {
      metrics: {
        queued: 0,
        successful: 0,
        failed: 0,
        retries: 0,
        averageDeliveryTime: 0
      },
      successRate: 0,
      queueStats: {
        queueLength: 0,
        activeRequests: 0,
        maxConcurrent: 5
      },
      health: { status: 'unknown', score: 0 }
    }

    // Calculate overall system score
    const componentScores = [
      claude.errorRate < 0.05 ? 1 : 0.5, // Claude health
      sheets.errorRate < 0.05 ? 1 : 0.5, // Sheets health
      webhooks.successRate > 0.8 ? 1 : webhooks.successRate, // Webhook health
      health.score // System health
    ]

    const overallScore = componentScores.reduce((sum, score) => sum + score, 0) / componentScores.length
    const isHealthy = overallScore > 0.7

    // Build comprehensive response
    const performanceData = {
      claude,
      sheets,
      webhooks,
      overall: {
        healthy: isHealthy,
        score: overallScore,
        timestamp: new Date().toISOString()
      },
      system: {
        cacheStats: health.cacheStats,
        queueStats: health.queueStats,
        monitorStats: health.monitorStats
      },
      metadata: {
        version: '2.0',
        collectionTime: Date.now(),
        components: ['claude', 'sheets', 'webhooks', 'system']
      }
    }

    return NextResponse.json(performanceData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Performance-Score': overallScore.toString(),
        'X-System-Health': isHealthy ? 'healthy' : 'degraded'
      }
    })

  } catch (error) {
    console.error('Performance metrics collection error:', error)
    
    // Return minimal error response
    return NextResponse.json({
      claude: {
        apiCalls: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        errorRate: 1,
        categories: []
      },
      sheets: {
        batchOperations: 0,
        averageProcessingTime: 0,
        cacheHitRate: 0,
        errorRate: 1,
        queueStats: { pending: 0, processing: false }
      },
      webhooks: {
        metrics: {
          queued: 0,
          successful: 0,
          failed: 0,
          retries: 0,
          averageDeliveryTime: 0
        },
        successRate: 0,
        queueStats: {
          queueLength: 0,
          activeRequests: 0,
          maxConcurrent: 5
        },
        health: { status: 'error', score: 0 }
      },
      overall: {
        healthy: false,
        score: 0,
        timestamp: new Date().toISOString()
      },
      error: 'Failed to collect performance metrics'
    }, { 
      status: 500,
      headers: {
        'X-System-Health': 'error'
      }
    })
  }
}

// Health check endpoint for quick status
async function handleHEAD(_request: NextRequest): Promise<NextResponse> {
  try {
    const health = getPerformanceHealth()
    
    return new NextResponse(null, {
      status: health.healthy ? 200 : 503,
      headers: {
        'X-System-Health': health.healthy ? 'healthy' : 'degraded',
        'X-Health-Score': health.score.toString(),
        'Cache-Control': 'no-cache, max-age=0'
      }
    })
  } catch {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-System-Health': 'error',
        'X-Health-Score': '0'
      }
    })
  }
}

// POST endpoint for performance actions (like cache clearing)
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'clear_cache':
        // Import cache clearing functions dynamically to avoid startup overhead
        const { aiCategoryCache, sheetsApiCache, webhookResponseCache } = await import('@/lib/performance')
        
        aiCategoryCache.clear()
        sheetsApiCache.clear()
        webhookResponseCache.clear()
        
        return NextResponse.json({
          success: true,
          message: 'All caches cleared',
          timestamp: new Date().toISOString()
        })

      case 'flush_queues':
        const { flushWebhookQueue } = await import('@/lib/webhooks-optimized')
        const flushResult = await flushWebhookQueue()
        
        return NextResponse.json({
          success: true,
          message: 'Queues flushed',
          processed: flushResult.processed,
          errors: flushResult.errors,
          timestamp: new Date().toISOString()
        })

      case 'health_check':
        const { validateSheetsAccessOptimized } = await import('@/lib/sheets-optimized')
        const { validateWebhooksOptimized } = await import('@/lib/webhooks-optimized')
        
        const [sheetsValidation, webhooksValidation] = await Promise.allSettled([
          validateSheetsAccessOptimized(),
          validateWebhooksOptimized()
        ])
        
        return NextResponse.json({
          success: true,
          validation: {
            sheets: sheetsValidation.status === 'fulfilled' ? sheetsValidation.value : { success: false },
            webhooks: webhooksValidation.status === 'fulfilled' ? webhooksValidation.value : { valid: false }
          },
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          availableActions: ['clear_cache', 'flush_queues', 'health_check']
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Performance action error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Apply security middleware
export const GET = composeMiddleware(
  withErrorHandling,
  withLogging,
  withSecurityHeaders,
  withRateLimit(rateLimitConfig)
)(handleGET)

export const HEAD = composeMiddleware(
  withErrorHandling,
  withSecurityHeaders,
  withRateLimit({ windowMs: 30000, maxRequests: 60 }) // More frequent for health checks
)(handleHEAD)

export const POST = composeMiddleware(
  withErrorHandling,
  withLogging,
  withSecurityHeaders,
  withRateLimit({ windowMs: 60000, maxRequests: 10 }) // Limited for actions
)(handlePOST)