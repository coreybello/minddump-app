/**
 * Performance Configuration and Optimization Framework
 * Provides caching, monitoring, and optimization utilities for real-time processing
 */

// Cache Management
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  hitCount: number
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupInterval: NodeJS.Timeout

  constructor(cleanupIntervalMs = 300000) { // 5 minutes default
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs)
  }

  set<T>(key: string, data: T, ttlMs = 3600000): void { // 1 hour default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      hitCount: 0
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    entry.hitCount++
    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  getStats() {
    const entries = Array.from(this.cache.values())
    return {
      size: this.cache.size,
      totalHits: entries.reduce((sum, entry) => sum + entry.hitCount, 0),
      avgHitCount: entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.hitCount, 0) / entries.length : 0,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.cache.clear()
  }
}

// Global cache instances
export const aiCategoryCache = new PerformanceCache(600000) // 10 minutes cleanup
export const sheetsApiCache = new PerformanceCache(300000) // 5 minutes cleanup
export const webhookResponseCache = new PerformanceCache(180000) // 3 minutes cleanup

// Request Queue Management
interface QueuedRequest {
  id: string
  payload: any
  timestamp: number
  retries: number
  maxRetries: number
  priority: 'low' | 'medium' | 'high'
}

class RequestQueue {
  private queue: QueuedRequest[] = []
  private processing = false
  private maxConcurrent = 3
  private currentProcessing = 0

  add(request: Omit<QueuedRequest, 'timestamp' | 'retries'>): void {
    this.queue.push({
      ...request,
      timestamp: Date.now(),
      retries: 0
    })

    // Sort by priority (high -> medium -> low) and timestamp
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp
    })

    this.processQueue()
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.currentProcessing >= this.maxConcurrent) return
    if (this.queue.length === 0) return

    this.processing = true
    this.currentProcessing++

    const request = this.queue.shift()!

    try {
      await this.processRequest(request)
    } catch (error) {
      if (request.retries < request.maxRetries) {
        request.retries++
        // Add back to queue with exponential backoff
        setTimeout(() => {
          this.queue.unshift(request)
          this.processQueue()
        }, Math.pow(2, request.retries) * 1000)
      } else {
        console.error(`Request ${request.id} failed after ${request.maxRetries} retries:`, error)
      }
    } finally {
      this.currentProcessing--
      this.processing = false
      
      // Process next item in queue
      if (this.queue.length > 0 && this.currentProcessing < this.maxConcurrent) {
        setTimeout(() => this.processQueue(), 100)
      }
    }
  }

  private async processRequest(request: QueuedRequest): Promise<void> {
    // Override this method for specific request processing
    console.log(`Processing request ${request.id}`)
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      processing: this.currentProcessing,
      maxConcurrent: this.maxConcurrent
    }
  }
}

// Specialized queues
export const webhookQueue = new (class extends RequestQueue {
  async processRequest(request: QueuedRequest): Promise<void> {
    const { url, payload } = request.payload
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MindDump-Webhook/1.0'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
    }

    console.log(`✅ Webhook ${request.id} sent successfully`)
  }
})()

export const sheetsQueue = new (class extends RequestQueue {
  async processRequest(request: QueuedRequest): Promise<void> {
    const { operation, data } = request.payload
    
    // Process Google Sheets operations here
    console.log(`Processing Sheets operation: ${operation}`)
    
    // Add actual Google Sheets API calls here
    // This would include batch operations for better performance
  }
})()

// Performance Monitoring
interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 1000

  record(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags
    })

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  getMetrics(name?: string, timeRangeMs = 300000): PerformanceMetric[] { // 5 minutes default
    const cutoff = Date.now() - timeRangeMs
    let filtered = this.metrics.filter(m => m.timestamp > cutoff)
    
    if (name) {
      filtered = filtered.filter(m => m.name === name)
    }
    
    return filtered
  }

  getAverage(name: string, timeRangeMs = 300000): number {
    const metrics = this.getMetrics(name, timeRangeMs)
    if (metrics.length === 0) return 0
    
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
  }

  getPercentile(name: string, percentile: number, timeRangeMs = 300000): number {
    const metrics = this.getMetrics(name, timeRangeMs)
    if (metrics.length === 0) return 0
    
    const sorted = metrics.map(m => m.value).sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  getStats() {
    const now = Date.now()
    const last5min = this.metrics.filter(m => now - m.timestamp < 300000)
    
    return {
      totalMetrics: this.metrics.length,
      recentMetrics: last5min.length,
      uniqueMetricNames: [...new Set(this.metrics.map(m => m.name))].length,
      oldestMetric: this.metrics.length > 0 ? this.metrics[0].timestamp : null
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Performance Utilities
export function withTiming<T>(operation: () => Promise<T>, metricName: string, tags?: Record<string, string>): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = performance.now()
    
    try {
      const result = await operation()
      const duration = performance.now() - startTime
      performanceMonitor.record(metricName, duration, tags)
      resolve(result)
    } catch (error) {
      const duration = performance.now() - startTime
      performanceMonitor.record(`${metricName}_error`, duration, tags)
      reject(error)
    }
  })
}

export function withCache<T>(
  key: string,
  operation: () => Promise<T>,
  cache: PerformanceCache = aiCategoryCache,
  ttlMs = 3600000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    // Check cache first
    const cached = cache.get<T>(key)
    if (cached !== null) {
      performanceMonitor.record('cache_hit', 1, { key })
      resolve(cached)
      return
    }

    try {
      const result = await operation()
      cache.set(key, result, ttlMs)
      performanceMonitor.record('cache_miss', 1, { key })
      resolve(result)
    } catch (error) {
      performanceMonitor.record('cache_error', 1, { key })
      reject(error)
    }
  })
}

// Debounce utility for voice input optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), waitMs)
  }
}

// Throttle utility for API calls
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= limitMs) {
      lastCall = now
      func(...args)
    }
  }
}

// Configuration
export const performanceConfig = {
  // Cache TTLs
  aiCategoryTTL: 24 * 60 * 60 * 1000, // 24 hours
  sheetsApiTTL: 5 * 60 * 1000, // 5 minutes
  webhookResponseTTL: 3 * 60 * 1000, // 3 minutes
  
  // Queue settings
  webhookBatchSize: 5,
  sheetsBatchSize: 10,
  maxQueueRetries: 3,
  
  // Timing thresholds (ms)
  slowRequestThreshold: 5000,
  criticalRequestThreshold: 10000,
  
  // Voice processing
  voiceDebounceMs: 300,
  voiceProcessingBatchSize: 5,
  
  // API optimization
  claudeTimeoutMs: 30000,
  sheetsTimeoutMs: 15000,
  webhookTimeoutMs: 10000,
  
  // Monitoring
  metricsRetentionMs: 24 * 60 * 60 * 1000, // 24 hours
  alertThresholds: {
    errorRate: 0.05, // 5%
    averageResponseTime: 2000, // 2 seconds
    cacheHitRate: 0.8 // 80%
  }
}

// Health check utility
export function getPerformanceHealth() {
  const cacheStats = {
    aiCache: aiCategoryCache.getStats(),
    sheetsCache: sheetsApiCache.getStats(),
    webhookCache: webhookResponseCache.getStats()
  }

  const queueStats = {
    webhookQueue: webhookQueue.getStats(),
    sheetsQueue: sheetsQueue.getStats()
  }

  const monitorStats = performanceMonitor.getStats()

  // Calculate health score
  const cacheHitRate = Object.values(cacheStats).reduce((sum, cache) => {
    const hitRate = cache.size > 0 ? cache.avgHitCount / cache.size : 1
    return sum + hitRate
  }, 0) / Object.keys(cacheStats).length

  const queueHealth = Object.values(queueStats).reduce((sum, queue) => {
    return sum + (queue.queueLength < 10 ? 1 : 0.5)
  }, 0) / Object.keys(queueStats).length

  const overallHealth = (cacheHitRate + queueHealth) / 2

  return {
    healthy: overallHealth > 0.7,
    score: overallHealth,
    cacheStats,
    queueStats,
    monitorStats,
    timestamp: new Date().toISOString()
  }
}

// Cleanup function
export function cleanupPerformanceResources(): void {
  aiCategoryCache.destroy()
  sheetsApiCache.destroy()
  webhookResponseCache.destroy()
}