/**
 * Enhanced Webhook Security Library
 * Provides comprehensive security for webhook communications
 */

import crypto from 'crypto'
import { NextRequest } from 'next/server'

export interface WebhookSecurityConfig {
  secret?: string
  allowedOrigins?: string[]
  maxRetries?: number
  timeoutMs?: number
  signatureAlgorithm?: 'sha256' | 'sha1'
  validateTimestamp?: boolean
  timestampToleranceMs?: number
}

export interface SecureWebhookPayload {
  input: string
  category: string
  subcategory?: string
  priority?: string
  timestamp: string
  expanded?: string
  signature?: string
  nonce?: string
}

// Default configuration for secure webhooks
const DEFAULT_CONFIG: Required<WebhookSecurityConfig> = {
  secret: process.env.WEBHOOK_SECRET || '',
  allowedOrigins: [],
  maxRetries: 3,
  timeoutMs: 10000,
  signatureAlgorithm: 'sha256',
  validateTimestamp: true,
  timestampToleranceMs: 300000 // 5 minutes
}

/**
 * Generate cryptographically secure webhook signature
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): string {
  const hmac = crypto.createHmac(algorithm, secret)
  hmac.update(payload, 'utf8')
  return `${algorithm}=${hmac.digest('hex')}`
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret, algorithm)
  
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expectedSignature, 'utf8')
  )
}

/**
 * Generate cryptographically secure nonce
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Validate webhook timestamp to prevent replay attacks
 */
export function validateTimestamp(
  timestamp: string,
  toleranceMs: number = 300000
): boolean {
  const now = Date.now()
  const webhookTime = new Date(timestamp).getTime()
  
  if (isNaN(webhookTime)) {
    return false
  }
  
  const timeDiff = Math.abs(now - webhookTime)
  return timeDiff <= toleranceMs
}

/**
 * Sanitize webhook headers for security
 */
export function sanitizeWebhookHeaders(headers: Record<string, string>): Record<string, string> {
  const safeHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'MindDumpApp-Webhook/2.0',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache'
  }
  
  // Add custom headers if they're safe
  const allowedCustomHeaders = [
    'x-webhook-source',
    'x-webhook-category',
    'x-webhook-priority',
    'x-webhook-timestamp'
  ]
  
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase()
    if (allowedCustomHeaders.includes(lowerKey)) {
      // Sanitize header values
      safeHeaders[key] = String(value).replace(/[\r\n\t]/g, '').substring(0, 256)
    }
  }
  
  return safeHeaders
}

/**
 * Create secure webhook payload with signature
 */
export function createSecureWebhookPayload(
  input: string,
  category: string,
  config: WebhookSecurityConfig = {},
  options: {
    subcategory?: string
    priority?: string
    expanded?: string
  } = {}
): SecureWebhookPayload {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const timestamp = new Date().toISOString()
  const nonce = generateNonce()
  
  const basePayload: SecureWebhookPayload = {
    input: input.trim().substring(0, 10000), // Limit input size
    category: category.trim().substring(0, 100),
    subcategory: options.subcategory?.trim().substring(0, 100),
    priority: options.priority?.trim().substring(0, 20),
    timestamp,
    expanded: options.expanded?.trim().substring(0, 50000),
    nonce
  }
  
  // Generate signature if secret is provided
  if (mergedConfig.secret) {
    const payloadString = JSON.stringify(basePayload)
    basePayload.signature = generateWebhookSignature(
      payloadString,
      mergedConfig.secret,
      mergedConfig.signatureAlgorithm
    )
  }
  
  return basePayload
}

/**
 * Validate incoming webhook request
 */
export function validateIncomingWebhook(
  request: NextRequest,
  config: WebhookSecurityConfig = {}
): { isValid: boolean; errors: string[] } {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const errors: string[] = []
  
  // Check Content-Type
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.startsWith('application/json')) {
    errors.push('Invalid Content-Type: must be application/json')
  }
  
  // Check User-Agent for suspicious patterns
  const userAgent = request.headers.get('user-agent') || ''
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /scraper/i,
    /spider/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /postman/i
  ]
  
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    errors.push('Suspicious User-Agent detected')
  }
  
  // Check Origin if specified
  if (mergedConfig.allowedOrigins.length > 0) {
    const origin = request.headers.get('origin') || ''
    if (!mergedConfig.allowedOrigins.includes(origin)) {
      errors.push('Origin not allowed')
    }
  }
  
  // Check for required security headers
  const webhookSignature = request.headers.get('x-webhook-signature')
  const webhookTimestamp = request.headers.get('x-webhook-timestamp')
  
  if (mergedConfig.secret && !webhookSignature) {
    errors.push('Missing webhook signature')
  }
  
  if (mergedConfig.validateTimestamp && !webhookTimestamp) {
    errors.push('Missing webhook timestamp')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Secure webhook sender with enhanced security
 */
export async function sendSecureWebhook(
  url: string,
  payload: SecureWebhookPayload,
  config: WebhookSecurityConfig = {}
): Promise<{ success: boolean; error?: string; response?: Response }> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Validate URL
  try {
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { success: false, error: 'Invalid URL protocol' }
    }
    
    // Prevent SSRF attacks - block private IP ranges
    if (parsedUrl.hostname === 'localhost' || 
        parsedUrl.hostname === '127.0.0.1' ||
        parsedUrl.hostname.startsWith('192.168.') ||
        parsedUrl.hostname.startsWith('10.') ||
        parsedUrl.hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) {
      return { success: false, error: 'Private IP addresses not allowed' }
    }
  } catch {
    return { success: false, error: 'Invalid URL format' }
  }
  
  const payloadString = JSON.stringify(payload)
  
  // Prepare secure headers
  const headers = sanitizeWebhookHeaders({
    'Content-Type': 'application/json',
    'User-Agent': 'MindDumpApp-Webhook/2.0',
    'X-Webhook-Source': 'minddumpapp',
    'X-Webhook-Category': payload.category,
    'X-Webhook-Timestamp': payload.timestamp
  })
  
  // Add signature header if secret is configured
  if (mergedConfig.secret && payload.signature) {
    headers['X-Webhook-Signature'] = payload.signature
  }
  
  let lastError: string | undefined
  
  for (let attempt = 0; attempt < mergedConfig.maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), mergedConfig.timeoutMs)
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        return { success: true, response }
      } else {
        lastError = `HTTP ${response.status}: ${response.statusText}`
        console.warn(`Secure webhook attempt ${attempt + 1} failed:`, lastError)
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      console.warn(`Secure webhook attempt ${attempt + 1} failed:`, lastError)
      
      // Wait before retry with exponential backoff
      if (attempt < mergedConfig.maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        )
      }
    }
  }
  
  return { success: false, error: lastError }
}

/**
 * Rate limiting for webhook endpoints
 */
class WebhookRateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>()
  private readonly windowMs: number
  private readonly maxRequests: number
  
  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }
  
  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const key = `webhook_${identifier}`
    const record = this.store.get(key)
    
    if (!record || now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + this.windowMs })
      return true
    }
    
    if (record.count >= this.maxRequests) {
      return false
    }
    
    record.count++
    return true
  }
  
  private cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Export rate limiter instance
export const webhookRateLimiter = new WebhookRateLimiter()

/**
 * Environment variable validation for webhook security
 */
export function validateWebhookEnvironment(): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = []
  
  if (!process.env.WEBHOOK_SECRET) {
    warnings.push('WEBHOOK_SECRET not set - signatures will not be generated')
  } else if (process.env.WEBHOOK_SECRET.length < 32) {
    warnings.push('WEBHOOK_SECRET should be at least 32 characters long')
  }
  
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.WEBHOOK_SECRET) {
      warnings.push('WEBHOOK_SECRET is required in production')
    }
    
    const webhookUrls = [
      'WEBHOOK_GOAL', 'WEBHOOK_HABIT', 'WEBHOOK_PROJECT_IDEA',
      'WEBHOOK_TASK', 'WEBHOOK_REMINDER', 'WEBHOOK_NOTE',
      'WEBHOOK_INSIGHT', 'WEBHOOK_LEARNING', 'WEBHOOK_CAREER',
      'WEBHOOK_METRIC', 'WEBHOOK_IDEA', 'WEBHOOK_SYSTEM',
      'WEBHOOK_AUTOMATION', 'WEBHOOK_PERSON', 'WEBHOOK_SENSITIVE'
    ]
    
    const placeholderUrls = webhookUrls.filter(urlEnv => 
      process.env[urlEnv]?.includes('webhook.site/placeholder')
    )
    
    if (placeholderUrls.length > 0) {
      warnings.push(`Production webhook URLs still use placeholder values: ${placeholderUrls.join(', ')}`)
    }
  }
  
  return {
    isValid: warnings.length === 0,
    warnings
  }
}