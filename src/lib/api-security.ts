/**
 * API Security Library
 * Provides comprehensive security utilities for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server'

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: NextRequest) => string
}

// Request validation schemas
export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    sanitize?: boolean
  }
}

// Security headers configuration
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}

// Rate limiting store (in-memory for this implementation)
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now()
    const record = this.store.get(key)

    if (!record || now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + config.windowMs })
      return true
    }

    if (record.count >= config.maxRequests) {
      return false
    }

    record.count++
    return true
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

const rateLimitStore = new RateLimitStore()

// Cleanup rate limit store every 5 minutes
setInterval(() => rateLimitStore.cleanup(), 5 * 60 * 1000)

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 10000) // Limit length
  }

  static sanitizeText(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 50000) // Larger limit for text content
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }

  static validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url)
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }

  static sanitizeArray(arr: unknown[], maxLength = 100): string[] {
    if (!Array.isArray(arr)) return []
    return arr
      .slice(0, maxLength)
      .filter(item => typeof item === 'string')
      .map(item => this.sanitizeString(item))
  }
}

/**
 * Request validation middleware
 */
export class RequestValidator {
  static validateSchema(data: unknown, schema: ValidationSchema): { isValid: boolean; errors: string[]; sanitized: Record<string, unknown> } {
    const errors: string[] = []
    const sanitized: Record<string, unknown> = {}

    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['Invalid request body'], sanitized: {} }
    }

    const dataObj = data as Record<string, unknown>

    for (const [field, rules] of Object.entries(schema)) {
      const value = dataObj[field]

      // Check required fields
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${field}' is required`)
        continue
      }

      // Skip validation for non-required missing fields
      if (value === undefined || value === null) {
        continue
      }

      // Type validation
      switch (rules.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`Field '${field}' must be a string`)
            break
          }
          
          if (rules.minLength && value.length < rules.minLength) {
            errors.push(`Field '${field}' must be at least ${rules.minLength} characters`)
            break
          }
          
          if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`Field '${field}' must be no more than ${rules.maxLength} characters`)
            break
          }
          
          if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(`Field '${field}' has invalid format`)
            break
          }
          
          sanitized[field] = rules.sanitize ? InputSanitizer.sanitizeString(value) : value
          break

        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`Field '${field}' must be an array`)
            break
          }
          
          sanitized[field] = InputSanitizer.sanitizeArray(value)
          break

        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            errors.push(`Field '${field}' must be an object`)
            break
          }
          
          sanitized[field] = value
          break

        default:
          sanitized[field] = value
      }
    }

    return { isValid: errors.length === 0, errors, sanitized }
  }
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(config: RateLimitConfig) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function (req: NextRequest): Promise<NextResponse> {
      const key = config.keyGenerator ? config.keyGenerator(req) : getClientIp(req)
      
      if (!rateLimitStore.isAllowed(key, config)) {
        return NextResponse.json(
          { error: 'Too many requests', retryAfter: Math.ceil(config.windowMs / 1000) },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil((Date.now() + config.windowMs) / 1000).toString()
            }
          }
        )
      }

      return handler(req)
    }
  }
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async function (req: NextRequest): Promise<NextResponse> {
    const response = await handler(req)
    
    // Add security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
  }
}

/**
 * CORS middleware
 */
export function withCORS(origins: string[] = []) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function (req: NextRequest): Promise<NextResponse> {
      const origin = req.headers.get('origin') || ''
      
      if (req.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': origins.includes(origin) ? origin : origins[0] || '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Max-Age': '86400'
          }
        })
      }
      
      const response = await handler(req)
      
      if (origins.length > 0 && origins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      } else if (origins.length === 0) {
        response.headers.set('Access-Control-Allow-Origin', '*')
      }
      
      return response
    }
  }
}

/**
 * Request logging middleware
 */
export function withLogging(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async function (req: NextRequest): Promise<NextResponse> {
    const start = Date.now()
    const ip = getClientIp(req)
    const _userAgent = req.headers.get('user-agent') || 'unknown'
    
    console.log(`🔍 ${req.method} ${req.url} from ${ip}`)
    
    try {
      const response = await handler(req)
      const duration = Date.now() - start
      
      console.log(`✅ ${req.method} ${req.url} - ${response.status} (${duration}ms)`)
      
      return response
    } catch (error) {
      const duration = Date.now() - start
      
      console.error(`❌ ${req.method} ${req.url} - Error (${duration}ms):`, error)
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Content-Type validation middleware
 */
export function withContentTypeValidation(allowedTypes: string[] = ['application/json']) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function (req: NextRequest): Promise<NextResponse> {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const contentType = req.headers.get('content-type') || ''
        const isAllowed = allowedTypes.some(type => contentType.startsWith(type))
        
        if (!isAllowed) {
          return NextResponse.json(
            { error: 'Unsupported Content-Type' },
            { status: 415 }
          )
        }
      }
      
      return handler(req)
    }
  }
}

/**
 * Request size limiting middleware
 */
export function withSizeLimit(maxSizeBytes: number = 1024 * 1024) { // 1MB default
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function (req: NextRequest): Promise<NextResponse> {
      const contentLength = req.headers.get('content-length')
      
      if (contentLength && parseInt(contentLength) > maxSizeBytes) {
        return NextResponse.json(
          { error: 'Request entity too large' },
          { status: 413 }
        )
      }
      
      return handler(req)
    }
  }
}

/**
 * Utility functions
 */
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return req.ip || 'unknown'
}

/**
 * Compose multiple middlewares
 */
export function composeMiddleware(...middlewares: Array<(handler: (req: NextRequest) => Promise<NextResponse>) => (req: NextRequest) => Promise<NextResponse>>) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return middlewares.reduceRight((composed, middleware) => {
      return middleware(composed)
    }, handler)
  }
}

/**
 * API Error class for structured error handling
 */
export class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'APIError'
  }

  toResponse(): NextResponse {
    return NextResponse.json(
      {
        error: this.message,
        code: this.code,
        details: this.details
      },
      { status: this.statusCode }
    )
  }
}

/**
 * Error handling middleware
 */
export function withErrorHandling(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async function (req: NextRequest): Promise<NextResponse> {
    try {
      return await handler(req)
    } catch (error) {
      console.error('API Error:', error)
      
      if (error instanceof APIError) {
        return error.toResponse()
      }
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}