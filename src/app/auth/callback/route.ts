import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import {
  composeMiddleware,
  withRateLimit,
  withSecurityHeaders,
  withLogging,
  withErrorHandling,
  APIError,
  InputSanitizer
} from '@/lib/api-security'

// Rate limiting for auth callback - stricter limits
const authCallbackRateLimit = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10 // Lower limit for auth endpoints
}

async function handleAuthCallback(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const _state = requestUrl.searchParams.get('state')
  
  // Validate origin for security
  const origin = requestUrl.origin
  if (!origin || !origin.startsWith('https://') && !origin.includes('localhost')) {
    throw new APIError(
      'Invalid origin',
      400,
      'INVALID_ORIGIN'
    )
  }

  // Handle OAuth errors
  if (error) {
    console.warn(`OAuth error: ${error}`);
    const sanitizedError = InputSanitizer.sanitizeString(error)
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(sanitizedError)}`)
  }

  if (code) {
    // Validate code format (basic validation)
    const sanitizedCode = InputSanitizer.sanitizeString(code)
    if (sanitizedCode.length < 10 || sanitizedCode.length > 500) {
      throw new APIError(
        'Invalid authorization code format',
        400,
        'INVALID_CODE'
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const result = await supabase.auth.exchangeCodeForSession(sanitizedCode)
      
      if (result.error) {
        console.error('Supabase auth error:', result.error)
        return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
      }
      
      // Log successful authentication (without sensitive data)
      console.log('✅ Successful authentication callback')
      
    } catch (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${origin}/auth?error=callback_failed`)
    }
  } else {
    // No code provided
    console.warn('Auth callback received without code parameter')
    return NextResponse.redirect(`${origin}/auth?error=no_code`)
  }

  // Redirect to the main app after successful authentication
  return NextResponse.redirect(`${origin}/`)
}

// Apply security middleware composition
export const GET = composeMiddleware(
  withErrorHandling,
  withLogging,
  withSecurityHeaders,
  withRateLimit(authCallbackRateLimit)
)(handleAuthCallback)