// import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs' // Disabled for auth removal
import { NextResponse, type NextRequest } from 'next/server'

// Security headers for all responses
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.anthropic.com https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none';"
}

// Rate limiting store (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Cleanup rate limit store every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return request.ip || 'unknown'
}

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const key = `rate_limit_${ip}`
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const clientIp = getClientIp(request)
  const pathname = request.nextUrl.pathname
  const method = request.method
  
  // Add security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Apply enhanced rate limiting based on route with stricter limits for sensitive endpoints
  let rateLimitPassed = true
  
  if (pathname.startsWith('/api/webhook')) {
    // Webhook endpoints: 30 requests per minute (stricter for security)
    rateLimitPassed = checkRateLimit(clientIp, 30, 60 * 1000)
  } else if (pathname.startsWith('/api/security')) {
    // Security endpoints: 10 requests per minute (very strict)
    rateLimitPassed = checkRateLimit(clientIp, 10, 60 * 1000)
  } else if (pathname.startsWith('/api/thoughts')) {
    // Thoughts API: 20 requests per minute (content creation)
    rateLimitPassed = checkRateLimit(clientIp, 20, 60 * 1000)
  } else if (pathname.startsWith('/api/')) {
    // Other API routes: 100 requests per minute
    rateLimitPassed = checkRateLimit(clientIp, 100, 60 * 1000)
  } else if (pathname.startsWith('/auth/')) {
    // Auth routes: 20 requests per minute
    rateLimitPassed = checkRateLimit(clientIp, 20, 60 * 1000)
  } else {
    // General routes: 200 requests per minute
    rateLimitPassed = checkRateLimit(clientIp, 200, 60 * 1000)
  }
  
  if (!rateLimitPassed) {
    console.warn(`Rate limit exceeded for IP: ${clientIp} on ${pathname}`)
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0'
        }
      }
    )
  }
  
  // Security checks for API routes
  if (pathname.startsWith('/api/')) {
    // Check Content-Type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentType = request.headers.get('content-type') || ''
      if (!contentType.startsWith('application/json')) {
        return NextResponse.json(
          { error: 'Content-Type must be application/json' },
          { status: 415 }
        )
      }
    }
    
    // Check request size
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json(
        { error: 'Request entity too large' },
        { status: 413 }
      )
    }
    
    // Block suspicious user agents
    const userAgent = request.headers.get('user-agent') || ''
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /scraper/i,
      /spider/i,
      /curl/i,
      /wget/i
    ]
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent))
    if (isSuspicious && !userAgent.includes('Googlebot')) {
      console.warn(`Suspicious user agent blocked: ${userAgent} from ${clientIp}`)
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Additional security checks for sensitive endpoints
    if (pathname.startsWith('/api/webhook') || pathname.startsWith('/api/security')) {
      // Require specific headers for webhook endpoints
      if (pathname.startsWith('/api/webhook') && method === 'POST') {
        const hasWebhookHeaders = request.headers.get('x-webhook-timestamp') || 
                                 request.headers.get('x-webhook-signature')
        
        // Log webhook access attempts for security monitoring
        console.log(`🔐 Webhook access attempt from ${clientIp}: ${hasWebhookHeaders ? 'with headers' : 'without headers'}`)
      }

      // Enhanced logging for security endpoints
      if (pathname.startsWith('/api/security')) {
        console.log(`🛡️ Security endpoint access from ${clientIp}: ${pathname}`)
        
        // Additional rate limiting for production security endpoints
        if (process.env.NODE_ENV === 'production') {
          const securityRateLimit = checkRateLimit(`security_${clientIp}`, 5, 60 * 1000) // 5 requests per minute
          if (!securityRateLimit) {
            console.warn(`Security endpoint rate limit exceeded for IP: ${clientIp}`)
            return NextResponse.json(
              { error: 'Security endpoint rate limit exceeded' },
              { status: 429 }
            )
          }
        }
      }
    }

    // Block common attack patterns in paths
    const attackPatterns = [
      /\.\./,           // Directory traversal
      /\/etc\/passwd/,  // Linux system files
      /\/proc\//,       // Process information
      /\.env/,          // Environment files
      /\/admin/,        // Admin paths
      /\/phpmyadmin/,   // Database admin
      /\/wp-admin/,     // WordPress admin
      /\.php$/,         // PHP files
      /\.asp$/,         // ASP files
      /\.jsp$/          // JSP files
    ]

    const hasAttackPattern = attackPatterns.some(pattern => pattern.test(pathname))
    if (hasAttackPattern) {
      console.warn(`Attack pattern detected in path: ${pathname} from ${clientIp}`)
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
  }
  
  // Log request for monitoring
  console.log(`🔍 ${method} ${pathname} from ${clientIp}`)
  
  // Original Supabase auth logic (currently disabled due to auth removal)
  // Keeping for reference when auth is re-enabled
  /*
  try {
    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient({ req: request, res: response })
    
    // Check if we have a session
    const { data: { session } } = await supabase.auth.getSession()
    
    // If no session and trying to access protected routes, redirect to auth
    if (!session && !pathname.startsWith('/auth') && !pathname.startsWith('/api/')) {
      const redirectUrl = new URL('/auth', request.url)
      return NextResponse.redirect(redirectUrl)
    }
    
    // If has session and trying to access auth page, redirect to home
    if (session && pathname.startsWith('/auth')) {
      const redirectUrl = new URL('/', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.error('Middleware auth error:', error)
    // Continue without authentication check if Supabase fails
  }
  */
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}