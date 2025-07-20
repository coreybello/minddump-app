/**
 * Secure Webhook routing system for categorized thoughts
 * Sends categorized thoughts to category-specific webhook URLs with enhanced security
 */

import { 
  createSecureWebhookPayload, 
  sendSecureWebhook, 
  validateWebhookEnvironment,
  webhookRateLimiter,
  WebhookSecurityConfig
} from './webhook-security'

export interface WebhookPayload {
  input: string
  category: string
  subcategory?: string
  priority?: string
  timestamp: string
  expanded?: string
  signature?: string
  nonce?: string
}

// Webhook configuration mapping categories to URLs
const WEBHOOKS: Record<string, string> = {
  Goal: "https://webhook.site/placeholder-goal",
  Habit: "https://webhook.site/placeholder-habit", 
  ProjectIdea: "https://webhook.site/placeholder-project",
  Task: "https://webhook.site/placeholder-task",
  Reminder: "https://webhook.site/placeholder-reminder",
  Note: "https://webhook.site/placeholder-note",
  Insight: "https://webhook.site/placeholder-insight",
  Learning: "https://webhook.site/placeholder-learning",
  Career: "https://webhook.site/placeholder-career",
  Metric: "https://webhook.site/placeholder-metric",
  Idea: "https://webhook.site/placeholder-idea",
  System: "https://webhook.site/placeholder-system",
  Automation: "https://webhook.site/placeholder-automation",
  Person: "https://webhook.site/placeholder-person",
  Sensitive: "https://webhook.site/placeholder-sensitive"
}

// Map thought types to webhook categories
const THOUGHT_TYPE_TO_WEBHOOK: Record<string, string> = {
  'idea': 'Idea',
  'task': 'Task', 
  'project': 'ProjectIdea',
  'vent': 'Note',
  'reflection': 'Insight',
  'goal': 'Goal',
  'habit': 'Habit',
  'reminder': 'Reminder',
  'learning': 'Learning',
  'career': 'Career',
  'metric': 'Metric',
  'system': 'System',
  'automation': 'Automation',
  'person': 'Person',
  'sensitive': 'Sensitive'
}

/**
 * Get webhook URL for a given thought type/category
 */
export function getWebhookUrl(thoughtType: string): string | null {
  const webhookCategory = THOUGHT_TYPE_TO_WEBHOOK[thoughtType.toLowerCase()]
  return webhookCategory ? WEBHOOKS[webhookCategory] : null
}

/**
 * Create webhook payload from thought data
 */
export function createWebhookPayload(
  input: string,
  thoughtType: string,
  expandedText?: string,
  urgency?: string,
  subcategory?: string
): WebhookPayload {
  return {
    input: input.trim(),
    category: thoughtType,
    subcategory,
    priority: urgency || undefined,
    timestamp: new Date().toISOString(),
    expanded: expandedText || undefined
  }
}

/**
 * Send secure webhook with enhanced security, retry logic and error handling
 */
export async function sendWebhook(
  url: string, 
  payload: WebhookPayload,
  retries: number = 3
): Promise<{ success: boolean; error?: string }> {
  // Security configuration for webhooks
  const securityConfig: WebhookSecurityConfig = {
    secret: process.env.WEBHOOK_SECRET,
    maxRetries: retries,
    timeoutMs: 15000,
    validateTimestamp: true,
    timestampToleranceMs: 300000 // 5 minutes
  }

  // Check rate limiting
  const clientId = 'webhook_system'
  if (!webhookRateLimiter.isAllowed(clientId)) {
    return { success: false, error: 'Webhook rate limit exceeded' }
  }

  // Create secure payload with signature
  const securePayload = createSecureWebhookPayload(
    payload.input,
    payload.category,
    securityConfig,
    {
      subcategory: payload.subcategory,
      priority: payload.priority,
      expanded: payload.expanded
    }
  )

  // Send using secure webhook function
  const result = await sendSecureWebhook(url, securePayload, securityConfig)
  
  if (result.success) {
    console.log(`✅ Secure webhook sent successfully for ${payload.category}`)
  } else {
    console.error(`❌ Secure webhook failed for ${payload.category}:`, result.error)
  }

  return { 
    success: result.success, 
    error: result.error 
  }
}

/**
 * Process webhook for a thought analysis
 * Non-blocking - logs errors but doesn't throw
 */
export async function processThoughtWebhook(
  thoughtText: string,
  thoughtAnalysis: any
): Promise<void> {
  try {
    const webhookUrl = getWebhookUrl(thoughtAnalysis.type)
    
    if (!webhookUrl) {
      console.log(`No webhook configured for thought type: ${thoughtAnalysis.type}`)
      return
    }

    const payload = createWebhookPayload(
      thoughtText,
      thoughtAnalysis.type,
      thoughtAnalysis.expandedThought,
      thoughtAnalysis.urgency,
      thoughtAnalysis.summary
    )

    console.log(`Sending webhook for ${thoughtAnalysis.type} to ${webhookUrl}`)
    
    const result = await sendWebhook(webhookUrl, payload)
    
    if (result.success) {
      console.log(`Webhook sent successfully for ${thoughtAnalysis.type}`)
    } else {
      console.error(`Webhook failed for ${thoughtAnalysis.type}:`, result.error)
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    // Don't throw - webhook failures should not block the main flow
  }
}

/**
 * Get all configured webhook categories
 */
export function getWebhookCategories(): string[] {
  return Object.keys(WEBHOOKS)
}

/**
 * Check if webhooks are enabled (based on environment)
 */
export function areWebhooksEnabled(): boolean {
  return process.env.ENABLE_WEBHOOKS !== 'false'
}

/**
 * Validate webhook security configuration
 */
export function validateWebhookSecurity(): { isValid: boolean; warnings: string[]; errors: string[] } {
  const { isValid, warnings } = validateWebhookEnvironment()
  const errors: string[] = []
  
  // Additional validation for production
  if (process.env.NODE_ENV === 'production') {
    // Check if placeholder URLs are still being used
    const placeholderCount = Object.values(WEBHOOKS).filter(url => 
      url.includes('webhook.site/placeholder')
    ).length
    
    if (placeholderCount > 0) {
      warnings.push(`${placeholderCount} webhook URLs are still using placeholder values`)
    }
    
    // Check for required security settings
    if (!process.env.WEBHOOK_SECRET) {
      errors.push('WEBHOOK_SECRET is required in production')
    }
  }
  
  // Validate webhook URLs
  Object.entries(WEBHOOKS).forEach(([category, url]) => {
    try {
      new URL(url)
    } catch {
      errors.push(`Invalid webhook URL for ${category}: ${url}`)
    }
  })
  
  return {
    isValid: isValid && errors.length === 0,
    warnings,
    errors
  }
}

/**
 * Get webhook security status
 */
export function getWebhookSecurityStatus(): {
  enabled: boolean
  hasSecret: boolean
  urlsConfigured: number
  placeholderUrls: number
  rateLimitActive: boolean
} {
  const hasSecret = !!(process.env.WEBHOOK_SECRET && process.env.WEBHOOK_SECRET.length >= 32)
  const urlsConfigured = Object.values(WEBHOOKS).filter(url => 
    !url.includes('placeholder')
  ).length
  const placeholderUrls = Object.values(WEBHOOKS).filter(url => 
    url.includes('placeholder')
  ).length
  
  return {
    enabled: areWebhooksEnabled(),
    hasSecret,
    urlsConfigured,
    placeholderUrls,
    rateLimitActive: true // Rate limiting is always active
  }
}