/**
 * Optimized webhook delivery system with queue management and performance monitoring
 */

import { webhookQueue, performanceMonitor, withTiming, performanceConfig } from './performance'
import type { WebhookPayload } from './webhooks'

// Enhanced webhook configuration with performance settings
interface OptimizedWebhookConfig {
  maxRetries: number
  retryDelayMs: number
  timeoutMs: number
  batchSize: number
  enableCircuitBreaker: boolean
  circuitBreakerThreshold: number
  circuitBreakerResetTimeMs: number
}

const defaultConfig: OptimizedWebhookConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: performanceConfig.webhookTimeoutMs,
  batchSize: performanceConfig.webhookBatchSize,
  enableCircuitBreaker: true,
  circuitBreakerThreshold: 5, // failures before opening circuit
  circuitBreakerResetTimeMs: 60000 // 1 minute
}

// Circuit breaker for failing webhooks
interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open'
  failureCount: number
  lastFailureTime: number
  nextAttemptTime: number
}

class WebhookCircuitBreaker {
  private circuits = new Map<string, CircuitBreakerState>()

  isCallAllowed(url: string): boolean {
    const circuit = this.circuits.get(url)
    if (!circuit) {
      this.circuits.set(url, {
        state: 'closed',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0
      })
      return true
    }

    const now = Date.now()

    switch (circuit.state) {
      case 'closed':
        return true
      
      case 'open':
        if (now >= circuit.nextAttemptTime) {
          circuit.state = 'half-open'
          return true
        }
        return false
      
      case 'half-open':
        return true
      
      default:
        return true
    }
  }

  recordSuccess(url: string): void {
    const circuit = this.circuits.get(url)
    if (circuit) {
      circuit.state = 'closed'
      circuit.failureCount = 0
      circuit.lastFailureTime = 0
    }
  }

  recordFailure(url: string, config: OptimizedWebhookConfig): void {
    let circuit = this.circuits.get(url)
    if (!circuit) {
      circuit = {
        state: 'closed',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0
      }
      this.circuits.set(url, circuit)
    }

    circuit.failureCount++
    circuit.lastFailureTime = Date.now()

    if (circuit.failureCount >= config.circuitBreakerThreshold) {
      circuit.state = 'open'
      circuit.nextAttemptTime = Date.now() + config.circuitBreakerResetTimeMs
      
      performanceMonitor.record('webhook_circuit_breaker_opened', 1, {
        url: this.sanitizeUrl(url)
      })
    }
  }

  getStats(): Record<string, CircuitBreakerState> {
    const stats: Record<string, CircuitBreakerState> = {}
    for (const [url, state] of this.circuits.entries()) {
      stats[this.sanitizeUrl(url)] = { ...state }
    }
    return stats
  }

  private sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url)
      return `${parsed.hostname}${parsed.pathname}`
    } catch {
      return 'invalid-url'
    }
  }
}

const circuitBreaker = new WebhookCircuitBreaker()

// Optimized webhook queue with enhanced error handling
class OptimizedWebhookQueue {
  private queue: Array<{
    id: string
    url: string
    payload: WebhookPayload
    config: OptimizedWebhookConfig
    attempts: number
    resolve: () => void
    reject: (error: Error) => void
    timestamp: number
  }> = []

  private processing = false
  private activeRequests = 0
  private maxConcurrent = 5

  async enqueue(
    url: string, 
    payload: WebhookPayload, 
    config: OptimizedWebhookConfig = defaultConfig
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      this.queue.push({
        id,
        url,
        payload,
        config,
        attempts: 0,
        resolve,
        reject,
        timestamp: Date.now()
      })

      performanceMonitor.record('webhook_queued', 1, {
        category: payload.category,
        url: this.sanitizeUrl(url)
      })

      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.activeRequests >= this.maxConcurrent) return
    if (this.queue.length === 0) return

    this.processing = true

    // Sort queue by priority and timestamp
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[a.payload.priority as keyof typeof priorityOrder] || 2
      const bPriority = priorityOrder[b.payload.priority as keyof typeof priorityOrder] || 2
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      return a.timestamp - b.timestamp
    })

    const webhookRequest = this.queue.shift()!
    this.activeRequests++

    try {
      await this.processWebhook(webhookRequest)
    } finally {
      this.activeRequests--
      this.processing = false
      
      // Continue processing if there are more items
      if (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
        setTimeout(() => this.processQueue(), 100)
      }
    }
  }

  private async processWebhook(webhookRequest: any): Promise<void> {
    const { id, url, payload, config, attempts, resolve, reject } = webhookRequest

    // Check circuit breaker
    if (config.enableCircuitBreaker && !circuitBreaker.isCallAllowed(url)) {
      performanceMonitor.record('webhook_circuit_breaker_blocked', 1)
      reject(new Error('Circuit breaker is open for this URL'))
      return
    }

    try {
      await withTiming(async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs)

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'MindDump-Optimized/1.0',
              'X-Request-ID': id,
              'X-Retry-Attempt': attempts.toString()
            },
            body: JSON.stringify({
              ...payload,
              metadata: {
                id,
                attempt: attempts + 1,
                timestamp: Date.now()
              }
            }),
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          // Success
          circuitBreaker.recordSuccess(url)
          resolve()
          
          performanceMonitor.record('webhook_success', 1, {
            category: payload.category,
            url: this.sanitizeUrl(url),
            attempt: (attempts + 1).toString()
          })

        } catch (fetchError) {
          clearTimeout(timeoutId)
          throw fetchError
        }

      }, 'webhook_delivery_duration', {
        category: payload.category,
        attempt: (attempts + 1).toString()
      })

    } catch (error) {
      webhookRequest.attempts++
      
      performanceMonitor.record('webhook_failure', 1, {
        category: payload.category,
        url: this.sanitizeUrl(url),
        attempt: webhookRequest.attempts.toString(),
        error: error instanceof Error ? error.message : 'unknown'
      })

      // Record circuit breaker failure
      if (config.enableCircuitBreaker) {
        circuitBreaker.recordFailure(url, config)
      }

      // Retry if attempts remaining
      if (webhookRequest.attempts < config.maxRetries) {
        // Exponential backoff
        const delay = config.retryDelayMs * Math.pow(2, webhookRequest.attempts - 1)
        
        setTimeout(() => {
          this.queue.unshift(webhookRequest) // Add back to front for retry
          this.processQueue()
        }, delay)
        
        performanceMonitor.record('webhook_retry_scheduled', 1, {
          attempt: webhookRequest.attempts.toString(),
          delay: delay.toString()
        })
      } else {
        reject(error instanceof Error ? error : new Error('Webhook delivery failed'))
      }
    }
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent,
      circuitBreakerStats: circuitBreaker.getStats()
    }
  }

  private sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url)
      return `${parsed.hostname}${parsed.pathname}`
    } catch {
      return 'invalid-url'
    }
  }
}

const optimizedWebhookQueue = new OptimizedWebhookQueue()

// Enhanced webhook mappings with performance tiers
const OPTIMIZED_WEBHOOKS: Record<string, { url: string; config: Partial<OptimizedWebhookConfig> }> = {
  Goal: { 
    url: process.env.WEBHOOK_GOAL || "https://webhook.site/placeholder-goal",
    config: { timeoutMs: 5000, maxRetries: 2 } // Fast delivery for goals
  },
  Habit: { 
    url: process.env.WEBHOOK_HABIT || "https://webhook.site/placeholder-habit",
    config: { timeoutMs: 10000, maxRetries: 3 } // Standard delivery
  },
  ProjectIdea: { 
    url: process.env.WEBHOOK_PROJECT || "https://webhook.site/placeholder-project",
    config: { timeoutMs: 15000, maxRetries: 5 } // Robust delivery for projects
  },
  Task: { 
    url: process.env.WEBHOOK_TASK || "https://webhook.site/placeholder-task",
    config: { timeoutMs: 5000, maxRetries: 2 } // Fast delivery for tasks
  },
  Reminder: { 
    url: process.env.WEBHOOK_REMINDER || "https://webhook.site/placeholder-reminder",
    config: { timeoutMs: 8000, maxRetries: 3 }
  },
  Note: { 
    url: process.env.WEBHOOK_NOTE || "https://webhook.site/placeholder-note",
    config: { timeoutMs: 10000, maxRetries: 2 }
  },
  Insight: { 
    url: process.env.WEBHOOK_INSIGHT || "https://webhook.site/placeholder-insight",
    config: { timeoutMs: 12000, maxRetries: 3 }
  },
  Learning: { 
    url: process.env.WEBHOOK_LEARNING || "https://webhook.site/placeholder-learning",
    config: { timeoutMs: 10000, maxRetries: 3 }
  },
  Career: { 
    url: process.env.WEBHOOK_CAREER || "https://webhook.site/placeholder-career",
    config: { timeoutMs: 10000, maxRetries: 3 }
  },
  Metric: { 
    url: process.env.WEBHOOK_METRIC || "https://webhook.site/placeholder-metric",
    config: { timeoutMs: 8000, maxRetries: 2 } // Fast for metrics
  },
  Idea: { 
    url: process.env.WEBHOOK_IDEA || "https://webhook.site/placeholder-idea",
    config: { timeoutMs: 10000, maxRetries: 3 }
  },
  System: { 
    url: process.env.WEBHOOK_SYSTEM || "https://webhook.site/placeholder-system",
    config: { timeoutMs: 12000, maxRetries: 4 }
  },
  Automation: { 
    url: process.env.WEBHOOK_AUTOMATION || "https://webhook.site/placeholder-automation",
    config: { timeoutMs: 15000, maxRetries: 4 }
  },
  Person: { 
    url: process.env.WEBHOOK_PERSON || "https://webhook.site/placeholder-person",
    config: { timeoutMs: 8000, maxRetries: 2 }
  },
  Sensitive: { 
    url: process.env.WEBHOOK_SENSITIVE || "https://webhook.site/placeholder-sensitive",
    config: { timeoutMs: 20000, maxRetries: 5, enableCircuitBreaker: false } // Extra robust for sensitive data
  }
}

/**
 * Optimized webhook delivery with performance monitoring
 */
export async function sendWebhookOptimized(
  category: string,
  payload: WebhookPayload,
  customConfig?: Partial<OptimizedWebhookConfig>
): Promise<{ success: boolean; error?: string; performance?: any }> {
  const startTime = performance.now()
  
  try {
    const webhookConfig = OPTIMIZED_WEBHOOKS[category]
    if (!webhookConfig) {
      throw new Error(`No webhook configured for category: ${category}`)
    }

    // Merge configurations
    const config: OptimizedWebhookConfig = {
      ...defaultConfig,
      ...webhookConfig.config,
      ...customConfig
    }

    // Enhanced payload with performance metadata
    const enhancedPayload: WebhookPayload = {
      ...payload,
      metadata: {
        version: '2.0',
        timestamp: new Date().toISOString(),
        category,
        performance: {
          queueTime: Date.now(),
          source: 'mindump-optimized'
        }
      }
    }

    // Queue for optimized delivery
    await optimizedWebhookQueue.enqueue(webhookConfig.url, enhancedPayload, config)
    
    const duration = performance.now() - startTime
    
    return {
      success: true,
      performance: {
        enqueueDuration: duration,
        queueStats: optimizedWebhookQueue.getStats()
      }
    }

  } catch (error) {
    const duration = performance.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown webhook error'
    
    performanceMonitor.record('webhook_enqueue_error', 1, {
      category,
      error: errorMessage
    })

    return {
      success: false,
      error: errorMessage,
      performance: {
        enqueueDuration: duration
      }
    }
  }
}

/**
 * Batch webhook delivery for multiple thoughts
 */
export async function sendWebhooksBatch(
  webhooks: Array<{ category: string; payload: WebhookPayload }>
): Promise<Array<{ success: boolean; category: string; error?: string }>> {
  const results = await Promise.allSettled(
    webhooks.map(async ({ category, payload }) => {
      const result = await sendWebhookOptimized(category, payload)
      return { ...result, category }
    })
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return {
        success: result.value.success,
        category: result.value.category,
        error: result.value.error
      }
    } else {
      return {
        success: false,
        category: webhooks[index].category,
        error: result.reason?.message || 'Unknown error'
      }
    }
  })
}

/**
 * Process thought webhook with optimization
 */
export async function processThoughtWebhookOptimized(
  thoughtText: string,
  thoughtAnalysis: any
): Promise<void> {
  try {
    const category = thoughtAnalysis.category || thoughtAnalysis.type
    if (!category) {
      console.warn('No category found for webhook processing')
      return
    }

    const payload: WebhookPayload = {
      input: thoughtText.trim(),
      category,
      subcategory: thoughtAnalysis.subcategory,
      priority: thoughtAnalysis.urgency || thoughtAnalysis.priority,
      timestamp: new Date().toISOString(),
      expanded: thoughtAnalysis.expandedThought
    }

    const result = await sendWebhookOptimized(category, payload)
    
    if (result.success) {
      console.log(`✅ Optimized webhook queued for ${category}`)
    } else {
      console.error(`❌ Optimized webhook failed for ${category}:`, result.error)
    }

  } catch (error) {
    console.error('Optimized webhook processing error:', error)
    performanceMonitor.record('webhook_processing_error', 1, {
      error: error instanceof Error ? error.message : 'unknown'
    })
  }
}

/**
 * Get webhook performance statistics
 */
export function getWebhookPerformanceStats() {
  const last5min = 300000
  
  const queueStats = optimizedWebhookQueue.getStats()
  const circuitBreakerStats = circuitBreaker.getStats()
  
  const metrics = {
    queued: performanceMonitor.getMetrics('webhook_queued', last5min).length,
    successful: performanceMonitor.getMetrics('webhook_success', last5min).length,
    failed: performanceMonitor.getMetrics('webhook_failure', last5min).length,
    retries: performanceMonitor.getMetrics('webhook_retry_scheduled', last5min).length,
    circuitBreakerEvents: performanceMonitor.getMetrics('webhook_circuit_breaker_opened', last5min).length,
    averageDeliveryTime: performanceMonitor.getAverage('webhook_delivery_duration', last5min)
  }

  const successRate = metrics.successful + metrics.failed > 0 
    ? metrics.successful / (metrics.successful + metrics.failed) 
    : 0

  return {
    metrics,
    successRate,
    queueStats,
    circuitBreakerStats,
    performance: {
      avgDeliveryTime: metrics.averageDeliveryTime,
      throughput: metrics.successful / 5, // per minute over 5 min window
      errorRate: 1 - successRate
    },
    health: {
      status: successRate > 0.9 ? 'healthy' : successRate > 0.7 ? 'degraded' : 'unhealthy',
      score: successRate
    },
    timestamp: Date.now()
  }
}

/**
 * Validate webhook configuration and connectivity
 */
export async function validateWebhooksOptimized(): Promise<{
  valid: boolean
  results: Array<{ category: string; url: string; status: string; responseTime?: number }>
  summary: { total: number; successful: number; failed: number }
}> {
  const results = await Promise.allSettled(
    Object.entries(OPTIMIZED_WEBHOOKS).map(async ([category, config]) => {
      const startTime = performance.now()
      
      try {
        // Test with minimal payload
        const testPayload = {
          input: 'test',
          category,
          timestamp: new Date().toISOString(),
          test: true
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'MindDump-Validator/1.0'
          },
          body: JSON.stringify(testPayload),
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        const responseTime = performance.now() - startTime

        return {
          category,
          url: config.url,
          status: response.ok ? 'success' : `error_${response.status}`,
          responseTime
        }

      } catch (error) {
        const responseTime = performance.now() - startTime
        
        return {
          category,
          url: config.url,
          status: error instanceof Error ? `error_${error.message}` : 'error_unknown',
          responseTime
        }
      }
    })
  )

  const validationResults = results.map(result => 
    result.status === 'fulfilled' ? result.value : {
      category: 'unknown',
      url: 'unknown',
      status: 'error_validation_failed'
    }
  )

  const successful = validationResults.filter(r => r.status === 'success').length
  const failed = validationResults.length - successful

  return {
    valid: successful > failed,
    results: validationResults,
    summary: {
      total: validationResults.length,
      successful,
      failed
    }
  }
}

/**
 * Emergency webhook flush - process all queued webhooks immediately
 */
export async function flushWebhookQueue(): Promise<{ processed: number; errors: number }> {
  const stats = optimizedWebhookQueue.getStats()
  const initialQueueLength = stats.queueLength
  
  // Wait for queue to process with timeout
  const maxWaitMs = 30000 // 30 seconds
  const startTime = Date.now()
  
  while (optimizedWebhookQueue.getStats().queueLength > 0 && 
         (Date.now() - startTime) < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  const finalStats = optimizedWebhookQueue.getStats()
  const processed = initialQueueLength - finalStats.queueLength
  
  performanceMonitor.record('webhook_queue_flush', processed)
  
  return {
    processed,
    errors: Math.max(0, finalStats.queueLength) // Remaining items are errors
  }
}