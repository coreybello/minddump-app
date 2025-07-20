import Anthropic from '@anthropic-ai/sdk'

// Validate API key on import
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️ ANTHROPIC_API_KEY is not configured. Claude functionality will be limited.')
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // Add timeout and retry configuration
  timeout: 30000, // 30 seconds
  maxRetries: 2
})

// Updated categorization types to support 15 new categories
export type ThoughtCategory = 
  | 'Goal'
  | 'Habit'
  | 'ProjectIdea'
  | 'Task'
  | 'Reminder'
  | 'Note'
  | 'Insight'
  | 'Learning'
  | 'Career'
  | 'Metric'
  | 'Idea'
  | 'System'
  | 'Automation'
  | 'Person'
  | 'Sensitive'
  | 'Uncategorized'

export interface ThoughtAnalysis {
  category: ThoughtCategory
  subcategory?: string
  priority?: 'low' | 'medium' | 'high'
  title?: string
  summary?: string
  actions: string[]
  expandedThought: string
  urgency: 'low' | 'medium' | 'high'
  sentiment?: 'positive' | 'neutral' | 'negative'
  // Legacy support for existing project functionality
  type?: 'idea' | 'task' | 'project' | 'vent' | 'reflection'
  markdown?: {
    readme?: string
    projectOverview?: string
  }
  github?: {
    repoName?: string
    visibility: 'private' | 'public'
  }
  techStack?: string[]
  features?: string[]
}

const ANALYSIS_PROMPT = `You are a personal AI assistant that processes unstructured thoughts and categorizes them into a comprehensive system. Your job is to:

1. Classify the thought into one of these 15 categories:
   - Goal: Personal/professional objectives
   - Habit: Routines/behavioral tracking
   - ProjectIdea: Apps/tools/features/businesses
   - Task: Actionable to-dos
   - Reminder: Time-based scheduling
   - Note: General information
   - Insight: Personal realizations
   - Learning: Study/research topics
   - Career: Job goals/networking
   - Metric: Self-tracking data
   - Idea: Creative thoughts
   - System: Frameworks/workflows
   - Automation: Bots to build
   - Person: People/meetings/conversations
   - Sensitive: Private entries
   - Uncategorized: Fallback

2. Assign optional subcategory and priority (low/medium/high)
3. Extract action items from the thought
4. Expand on the thought with helpful detail
5. Determine urgency and sentiment
6. For technical project ideas, include technical details

Always respond in valid JSON format matching this structure:
{
  "category": "Goal" | "Habit" | "ProjectIdea" | "Task" | "Reminder" | "Note" | "Insight" | "Learning" | "Career" | "Metric" | "Idea" | "System" | "Automation" | "Person" | "Sensitive" | "Uncategorized",
  "subcategory": "optional subcategory string",
  "priority": "low" | "medium" | "high",
  "title": "brief descriptive title",
  "summary": "concise summary",
  "actions": ["action1", "action2"],
  "expandedThought": "detailed expansion of the original thought",
  "urgency": "low" | "medium" | "high",
  "sentiment": "positive" | "neutral" | "negative",
  "type": "project",
  "markdown": {
    "readme": "...",
    "projectOverview": "..."
  },
  "github": {
    "repoName": "...",
    "visibility": "private"
  },
  "techStack": ["tech1", "tech2"],
  "features": ["feature1", "feature2"]
}

Only include type, markdown, github, techStack, and features for ProjectIdea category thoughts. The type field is for legacy compatibility.`

export async function analyzeThought(rawText: string): Promise<ThoughtAnalysis> {
  // Input validation
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Invalid input: rawText must be a non-empty string')
  }
  
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Claude API key not configured')
  }
  
  // Sanitize input
  const sanitizedText = rawText
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .substring(0, 50000) // Limit length
  
  if (sanitizedText.length < 1) {
    throw new Error('Input text is empty after sanitization')
  }

  try {
    console.log('🤔 Analyzing thought with Claude...')
    const startTime = Date.now()
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.1, // Lower temperature for more consistent results
      messages: [
        {
          role: 'user',
          content: `${ANALYSIS_PROMPT}\n\nUser thought: "${sanitizedText}"`
        }
      ]
    })

    const duration = Date.now() - startTime
    console.log(`✅ Claude analysis completed in ${duration}ms`)

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let analysis: ThoughtAnalysis
    try {
      analysis = JSON.parse(content.text) as ThoughtAnalysis
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', parseError)
      throw new Error('Invalid JSON response from Claude')
    }

    // Validate analysis structure - support new category field and legacy type field
    if (!analysis.category && !analysis.type) {
      throw new Error('Analysis must include either category or type field')
    }
    if (!analysis.expandedThought || !analysis.urgency) {
      throw new Error('Incomplete analysis from Claude')
    }

    // Sanitize analysis results with new category system
    const sanitizedAnalysis: ThoughtAnalysis = {
      category: analysis.category || 'Uncategorized', // Default to Uncategorized if not provided
      subcategory: analysis.subcategory?.substring(0, 100),
      priority: analysis.priority,
      title: analysis.title?.substring(0, 200),
      summary: analysis.summary?.substring(0, 1000),
      actions: Array.isArray(analysis.actions) 
        ? analysis.actions.slice(0, 20).map(action => 
            typeof action === 'string' ? action.substring(0, 500) : String(action).substring(0, 500)
          )
        : [],
      expandedThought: analysis.expandedThought.substring(0, 10000),
      urgency: analysis.urgency,
      sentiment: analysis.sentiment,
      // Legacy support
      type: analysis.type,
      markdown: analysis.markdown ? {
        readme: analysis.markdown.readme?.substring(0, 50000),
        projectOverview: analysis.markdown.projectOverview?.substring(0, 50000)
      } : undefined,
      github: analysis.github ? {
        repoName: analysis.github.repoName?.substring(0, 100),
        visibility: analysis.github.visibility
      } : undefined,
      techStack: Array.isArray(analysis.techStack)
        ? analysis.techStack.slice(0, 20).map(tech => String(tech).substring(0, 50))
        : undefined,
      features: Array.isArray(analysis.features)
        ? analysis.features.slice(0, 30).map(feature => String(feature).substring(0, 200))
        : undefined
    }

    return sanitizedAnalysis
  } catch (error) {
    console.error('Error analyzing thought:', error)
    
    // If it's an API error, re-throw with more context
    if (error instanceof Anthropic.APIError) {
      const errorMessage = `Claude API error (${error.status}): ${error.message}`
      throw new Error(errorMessage)
    }
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Unknown error occurred during analysis')
  }
}

export async function generateWeeklyReview(thoughts: Array<{type: string, raw_text: string}>): Promise<string> {
  // Input validation
  if (!Array.isArray(thoughts)) {
    throw new Error('Invalid input: thoughts must be an array')
  }
  
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Claude API key not configured')
  }
  
  if (thoughts.length === 0) {
    return 'No thoughts to review this week.'
  }

  try {
    // Sanitize and limit thoughts
    const sanitizedThoughts = thoughts
      .slice(0, 100) // Limit to 100 thoughts
      .filter(t => t && typeof t.type === 'string' && typeof t.raw_text === 'string')
      .map(t => ({
        type: t.type.substring(0, 20),
        raw_text: t.raw_text.substring(0, 500)
      }))
    
    const thoughtsText = sanitizedThoughts
      .map(t => `${t.type}: ${t.raw_text}`)
      .join('\n')
      .substring(0, 10000) // Limit total length
    
    console.log('📊 Generating weekly review with Claude...')
    const startTime = Date.now()
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `Generate a weekly review summary based on these thoughts and activities:

${thoughtsText}

Provide insights on:
- Key themes and patterns
- Progress on projects and goals
- Recommendations for the upcoming week
- Areas of focus or concern

Format as markdown. Keep the review concise and actionable.`
        }
      ]
    })

    const duration = Date.now() - startTime
    console.log(`✅ Weekly review generated in ${duration}ms`)

    const content = response.content[0]
    if (content.type === 'text') {
      // Sanitize the response
      return content.text
        .replace(/[<>]/g, '') // Remove potential HTML
        .substring(0, 20000) // Limit length
    }
    
    throw new Error('Unexpected response format from Claude')
  } catch (error) {
    console.error('Error generating weekly review:', error)
    
    if (error instanceof Anthropic.APIError) {
      const errorMessage = `Claude API error (${error.status}): ${error.message}`
      throw new Error(errorMessage)
    }
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Unable to generate review at this time')
  }
}

/**
 * Test Claude API connectivity
 */
export async function testClaudeConnection(): Promise<boolean> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return false
  }
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Test'
        }
      ]
    })
    
    return response.content[0]?.type === 'text'
  } catch (error) {
    console.error('Claude connection test failed:', error)
    return false
  }
}

/**
 * Get Claude API usage statistics (if available)
 */
export async function getClaudeUsageStats(): Promise<{ available: boolean; details?: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { available: false, details: 'API key not configured' }
  }
  
  try {
    // This is a simple test to see if the API is responsive
    const testConnection = await testClaudeConnection()
    return { 
      available: testConnection, 
      details: testConnection ? 'API responding normally' : 'API not responding'
    }
  } catch (error) {
    return { 
      available: false, 
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all available thought categories for the new categorization system
 */
export function getAvailableCategories(): ThoughtCategory[] {
  return [
    'Goal',
    'Habit', 
    'ProjectIdea',
    'Task',
    'Reminder',
    'Note',
    'Insight',
    'Learning',
    'Career',
    'Metric',
    'Idea',
    'System',
    'Automation',
    'Person',
    'Sensitive',
    'Uncategorized'
  ]
}

/**
 * Get category description for UI display
 */
export function getCategoryDescription(category: ThoughtCategory): string {
  const descriptions: Record<ThoughtCategory, string> = {
    Goal: 'Personal/professional objectives',
    Habit: 'Routines/behavioral tracking',
    ProjectIdea: 'Apps/tools/features/businesses',
    Task: 'Actionable to-dos',
    Reminder: 'Time-based scheduling',
    Note: 'General information',
    Insight: 'Personal realizations',
    Learning: 'Study/research topics',
    Career: 'Job goals/networking',
    Metric: 'Self-tracking data',
    Idea: 'Creative thoughts',
    System: 'Frameworks/workflows',
    Automation: 'Bots to build',
    Person: 'People/meetings/conversations',
    Sensitive: 'Private entries',
    Uncategorized: 'Fallback category'
  }
  return descriptions[category]
}

/**
 * Check if a category is valid
 */
export function isValidCategory(category: string): category is ThoughtCategory {
  return getAvailableCategories().includes(category as ThoughtCategory)
}