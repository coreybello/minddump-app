import { NextRequest, NextResponse } from 'next/server'
import { analyzeThought, ThoughtCategory, getAvailableCategories, isValidCategory } from '@/lib/claude'
import { createGoogleSheet, generateSheetTitle, logThoughtToMaster, initializeMasterSheet } from '@/lib/sheets'
import { processThoughtWebhook, areWebhooksEnabled } from '@/lib/webhooks'
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

// Create dynamic category validation pattern from available categories
const availableCategories = getAvailableCategories()
const categoryPattern = new RegExp(`^(auto-detect|${availableCategories.join('|')})$`, 'i')

// Validation schema for POST requests
const thoughtSchema: ValidationSchema = {
  text: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 50000,
    sanitize: true
  },
  category: {
    type: 'string',
    required: false,
    pattern: categoryPattern,
    sanitize: true
  },
  analysis: {
    type: 'object',
    required: false
  }
}

// Rate limiting: 20 requests per minute per IP
const rateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  let requestBody: unknown
  
  try {
    requestBody = await request.json()
  } catch (_error) {
    throw new APIError('Invalid JSON in request body', 400, 'INVALID_JSON')
  }

  // Validate and sanitize input
  const validation = RequestValidator.validateSchema(requestBody, thoughtSchema)
  
  if (!validation.isValid) {
    throw new APIError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      { errors: validation.errors }
    )
  }

  const { text, category, analysis } = validation.sanitized as {
    text: string
    category?: string
    analysis?: Record<string, unknown>
  }

  // Note: Authentication removed - app now works without user accounts
  // All data is stored without user association

  // Input validation for API key requirement
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new APIError(
      'Claude API not configured',
      503,
      'SERVICE_UNAVAILABLE'
    )
  }

  // Use provided analysis or analyze the thought with Claude
  let thoughtAnalysis
  if (analysis) {
    // Validate provided analysis structure for new format
    if (typeof analysis !== 'object' || (!analysis.category && !analysis.type)) {
      throw new APIError(
        'Invalid analysis format - must include category or type field',
        400,
        'INVALID_ANALYSIS'
      )
    }
    thoughtAnalysis = analysis
  } else {
    try {
      // Analyze the thought with Claude API with timeout
      const analysisPromise = analyzeThought(text)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timeout')), 30000)
      )
      
      thoughtAnalysis = await Promise.race([analysisPromise, timeoutPromise])
      
      // Override category if manually selected (new categorization system)
      if (category && category !== 'auto-detect') {
        if (isValidCategory(category)) {
          thoughtAnalysis.category = category as ThoughtCategory
          // Set legacy type field for backward compatibility
          const legacyMapping: Record<string, string> = {
            'Goal': 'task',
            'Habit': 'task',
            'ProjectIdea': 'project',
            'Task': 'task',
            'Reminder': 'task',
            'Note': 'reflection',
            'Insight': 'reflection',
            'Learning': 'reflection',
            'Career': 'task',
            'Metric': 'reflection',
            'Idea': 'idea',
            'System': 'project',
            'Automation': 'project',
            'Person': 'reflection',
            'Sensitive': 'vent',
            'Uncategorized': 'reflection'
          }
          thoughtAnalysis.type = legacyMapping[category] || 'reflection'
        }
      }
    } catch (error) {
      console.error('Claude analysis error:', error)
      throw new APIError(
        'Failed to analyze thought',
        503,
        'ANALYSIS_FAILED',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      )
    }
  }

  // Generate secure ID
  const thoughtId = `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Create thought object with validation (no database storage - using in-memory for demo)
  const thought = {
    id: thoughtId,
    raw_text: text.substring(0, 50000), // Ensure length limit
    type: thoughtAnalysis.type, // Legacy field for backward compatibility
    category: thoughtAnalysis.category || 'Uncategorized', // New categorization field
    subcategory: thoughtAnalysis.subcategory?.substring(0, 100),
    priority: thoughtAnalysis.priority,
    title: thoughtAnalysis.title?.substring(0, 200),
    summary: thoughtAnalysis.summary?.substring(0, 1000),
    expanded_text: thoughtAnalysis.expandedThought?.substring(0, 100000),
    actions: Array.isArray(thoughtAnalysis.actions) 
      ? thoughtAnalysis.actions.slice(0, 50).map(action => 
          typeof action === 'string' ? action.substring(0, 500) : String(action).substring(0, 500)
        )
      : [],
    urgency: thoughtAnalysis.urgency,
    sentiment: thoughtAnalysis.sentiment,
    created_at: new Date().toISOString()
  }

  // Integration status tracking
  let project = null
  let sheetsUrl = null
  let webhookStatus = { success: false, error: null as string | null }
  let masterSheetStatus = { success: false, error: null as string | null }

  // ALWAYS log to master sheet for centralized tracking
  try {
    await logThoughtToMaster(
      text,
      thought.category,
      thought.subcategory,
      thought.priority ? (thought.priority.charAt(0).toUpperCase() + thought.priority.slice(1)) as 'Low' | 'Medium' | 'High' : undefined,
      thought.expanded_text
    )
    masterSheetStatus.success = true
    console.log('Successfully logged to master sheet')
  } catch (masterSheetError) {
    masterSheetStatus.error = masterSheetError instanceof Error ? masterSheetError.message : 'Unknown master sheet error'
    console.warn('Master sheet logging failed:', masterSheetError)
    // Continue processing even if master sheet fails
  }

  // If it's a project idea (new categorization) or legacy project type, create project record and Google Sheet
  if ((thought.category === 'ProjectIdea' || thoughtAnalysis.type === 'project') && thoughtAnalysis.title) {
    try {
      // Validate project data
      const title = String(thoughtAnalysis.title).substring(0, 200)
      const summary = String(thoughtAnalysis.summary || '').substring(0, 1000)
      
      // Create Google Sheet if we have the necessary data
      if (process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
        const sheetTitle = generateSheetTitle(title, 'projectidea')
        
        // Add timeout for Google Sheets creation
        const sheetsPromise = createGoogleSheet({
          title: sheetTitle,
          category: 'projectidea', // Use new category ID
          description: summary,
          expandedText: thoughtAnalysis.expandedThought?.substring(0, 10000),
          actions: thought.actions,
          priority: thoughtAnalysis.urgency as 'low' | 'medium' | 'high',
          tags: Array.isArray(thoughtAnalysis.techStack) 
            ? thoughtAnalysis.techStack.slice(0, 20).map(tag => String(tag).substring(0, 50))
            : [],
        })
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Google Sheets timeout')), 15000)
        )
        
        try {
          sheetsUrl = await Promise.race([sheetsPromise, timeoutPromise])
        } catch (sheetsError) {
          console.warn('Google Sheets creation failed:', sheetsError)
          // Continue without Google Sheet
        }
      }

      // Create project object with validation (no database storage - using in-memory for demo)
      project = {
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        thought_id: thought.id,
        title,
        summary,
        readme: thoughtAnalysis.markdown?.readme?.substring(0, 50000),
        overview: thoughtAnalysis.markdown?.projectOverview?.substring(0, 50000),
        sheets_url: sheetsUrl,
        category: thought.category, // Use new category system
        subcategory: thought.subcategory,
        priority: thought.priority,
        tech_stack: Array.isArray(thoughtAnalysis.techStack) 
          ? thoughtAnalysis.techStack.slice(0, 20).map(tech => String(tech).substring(0, 50))
          : [],
        features: Array.isArray(thoughtAnalysis.features)
          ? thoughtAnalysis.features.slice(0, 50).map(feature => String(feature).substring(0, 200))
          : [],
        created_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error creating project/Google Sheet:', error)
      // Continue without project creation if it fails
    }
  }

    // Note: Todos would be created here in a full implementation
    // For now, actions are included in the thought analysis response

  // Send webhook for categorized thought with enhanced tracking
  if (areWebhooksEnabled()) {
    try {
      // Use enhanced webhook processing with new category system
      const webhookData = {
        ...thoughtAnalysis,
        category: thought.category, // Ensure we use the final category
        type: thought.type || thoughtAnalysis.category // Legacy support
      }
      
      // Process webhook with status tracking (non-blocking)
      processThoughtWebhook(text, webhookData)
        .then(() => {
          webhookStatus.success = true
          console.log(`Webhook sent successfully for category: ${thought.category}`)
        })
        .catch(error => {
          webhookStatus.error = error instanceof Error ? error.message : 'Unknown webhook error'
          console.error('Background webhook processing failed:', error)
          // Webhook failures don't affect the main response
        })
    } catch (error) {
      webhookStatus.error = error instanceof Error ? error.message : 'Webhook setup error'
      console.error('Webhook setup error:', error)
    }
  } else {
    console.log('Webhooks disabled - skipping webhook processing')
  }

  // Return successful response with sanitized data and integration status
  return NextResponse.json({
    success: true,
    thought,
    project,
    analysis: {
      // New categorization fields
      category: thoughtAnalysis.category || 'Uncategorized',
      subcategory: thoughtAnalysis.subcategory?.substring(0, 100),
      priority: thoughtAnalysis.priority,
      // Enhanced analysis fields
      type: thoughtAnalysis.type, // Legacy support
      title: thoughtAnalysis.title?.substring(0, 200),
      summary: thoughtAnalysis.summary?.substring(0, 1000),
      urgency: thoughtAnalysis.urgency,
      sentiment: thoughtAnalysis.sentiment
    },
    integrations: {
      masterSheet: masterSheetStatus,
      webhook: webhookStatus,
      projectSheet: sheetsUrl ? { success: true, url: sheetsUrl } : null
    },
    sheetsUrl, // Legacy field for backward compatibility
    actionsCreated: thought.actions.length,
    timestamp: new Date().toISOString(),
    categorization: {
      system: 'enhanced_15_category',
      availableCategories: getAvailableCategories()
    }
  })
}

// Apply security middleware composition
export const POST = composeMiddleware(
  withErrorHandling,
  withLogging,
  withSecurityHeaders,
  withRateLimit(rateLimitConfig),
  withContentTypeValidation(['application/json']),
  withSizeLimit(5 * 1024 * 1024) // 5MB limit
)(handlePOST)

// GET endpoint with lighter rate limiting
const getThoughtsRateLimit = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60 // Higher limit for GET requests
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  // Note: Authentication removed - returning empty thoughts array for demo
  // In a full implementation, this would fetch from a database or storage
  
  // Validate query parameters
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100) // Max 100
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)
  
  // Return empty array for now - in a real app, this would fetch stored thoughts  
  const thoughts: unknown[] = []
  
  return NextResponse.json({
    thoughts,
    pagination: {
      limit,
      offset,
      total: 0,
      hasMore: false
    },
    timestamp: new Date().toISOString()
  })
}

// Apply security middleware composition for GET
export const GET = composeMiddleware(
  withErrorHandling,
  withLogging,
  withSecurityHeaders,
  withRateLimit(getThoughtsRateLimit)
)(handleGET)