/**
 * Optimized Claude API client with caching, batching, and performance monitoring
 */

import Anthropic from '@anthropic-ai/sdk'
import { aiCategoryCache, withCache, withTiming, performanceMonitor, performanceConfig } from './performance'
import type { ThoughtCategory, ThoughtAnalysis } from './claude'

// Initialize Anthropic client with optimizations
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: performanceConfig.claudeTimeoutMs,
  maxRetries: 3,
  // Add request middleware for monitoring
  defaultHeaders: {
    'User-Agent': 'MindDump-Optimized/1.0'
  }
})

// Cached category mapping for fast lookups
const categoryCache = new Map<string, ThoughtCategory>()

// Batch processing queue for multiple thoughts
interface BatchedThought {
  id: string
  text: string
  category?: string
  resolve: (analysis: ThoughtAnalysis) => void
  reject: (error: Error) => void
}

class ThoughtBatcher {
  private queue: BatchedThought[] = []
  private processing = false
  private batchSize = 3
  private maxWaitMs = 2000

  add(thought: Omit<BatchedThought, 'resolve' | 'reject'>): Promise<ThoughtAnalysis> {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...thought, resolve, reject })
      this.scheduleProcess()
    })
  }

  private scheduleProcess(): void {
    if (this.processing) return

    // Process immediately if batch is full
    if (this.queue.length >= this.batchSize) {
      this.processBatch()
      return
    }

    // Otherwise, wait for more items or timeout
    setTimeout(() => {
      if (this.queue.length > 0 && !this.processing) {
        this.processBatch()
      }
    }, this.maxWaitMs)
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true
    const batch = this.queue.splice(0, this.batchSize)

    try {
      // Process batch in parallel for better performance
      const promises = batch.map(item => this.processSingleThought(item))
      await Promise.allSettled(promises)
    } finally {
      this.processing = false
      
      // Process remaining queue if any
      if (this.queue.length > 0) {
        this.scheduleProcess()
      }
    }
  }

  private async processSingleThought(thought: BatchedThought): Promise<void> {
    try {
      const analysis = await analyzeThoughtOptimized(thought.text, thought.category)
      thought.resolve(analysis)
    } catch (error) {
      thought.reject(error as Error)
    }
  }
}

const thoughtBatcher = new ThoughtBatcher()

/**
 * Optimized thought analysis with caching and performance monitoring
 */
export async function analyzeThoughtOptimized(
  rawText: string, 
  preselectedCategory?: string
): Promise<ThoughtAnalysis> {
  // Input validation with performance monitoring
  return withTiming(async () => {
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('Invalid input: rawText must be a non-empty string')
    }
    
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Claude API key not configured')
    }
    
    // Sanitize input
    const sanitizedText = rawText
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 50000)
    
    if (sanitizedText.length < 1) {
      throw new Error('Input text is empty after sanitization')
    }

    // Create cache key
    const cacheKey = `thought_analysis:${Buffer.from(sanitizedText).toString('base64').substring(0, 50)}:${preselectedCategory || 'auto'}`
    
    // Try cache first with performance monitoring
    return withCache(
      cacheKey,
      async () => {
        performanceMonitor.record('claude_api_call', 1, {
          textLength: sanitizedText.length.toString(),
          hasCategory: (!!preselectedCategory).toString()
        })

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          temperature: 0.1,
          messages: [
            {
              role: 'user',
              content: `${getOptimizedAnalysisPrompt()}\n\nUser thought: "${sanitizedText}"`
            }
          ]
        })

        const content = response.content[0]
        if (content.type !== 'text') {
          throw new Error('Unexpected response type from Claude')
        }

        let analysis: ThoughtAnalysis
        try {
          analysis = JSON.parse(content.text) as ThoughtAnalysis
        } catch (parseError) {
          performanceMonitor.record('claude_parse_error', 1)
          throw new Error('Invalid JSON response from Claude')
        }

        // Validate and sanitize analysis
        const sanitizedAnalysis = sanitizeAnalysis(analysis, preselectedCategory)
        
        performanceMonitor.record('claude_analysis_success', 1, {
          category: sanitizedAnalysis.category
        })

        return sanitizedAnalysis
      },
      aiCategoryCache,
      performanceConfig.aiCategoryTTL
    )
  }, 'claude_analysis_duration', {
    textLength: sanitizedText.length.toString(),
    cached: aiCategoryCache.has(cacheKey).toString()
  })
}

/**
 * Batch analyze multiple thoughts for better performance
 */
export async function analyzeThoughtsBatch(
  thoughts: Array<{ id: string; text: string; category?: string }>
): Promise<Array<{ id: string; analysis: ThoughtAnalysis }>> {
  const results = await Promise.allSettled(
    thoughts.map(async thought => {
      const analysis = await thoughtBatcher.add(thought)
      return { id: thought.id, analysis }
    })
  )

  return results
    .filter((result): result is PromiseFulfilledResult<{ id: string; analysis: ThoughtAnalysis }> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value)
}

/**
 * Optimized category detection with caching
 */
export function getOptimizedCategoryMapping(): Map<string, ThoughtCategory> {
  if (categoryCache.size === 0) {
    const categories: ThoughtCategory[] = [
      'Goal', 'Habit', 'ProjectIdea', 'Task', 'Reminder', 'Note',
      'Insight', 'Learning', 'Career', 'Metric', 'Idea', 'System',
      'Automation', 'Person', 'Sensitive', 'Uncategorized'
    ]
    
    categories.forEach(category => {
      categoryCache.set(category.toLowerCase(), category)
      // Add common aliases
      const aliases = getCategoryAliases(category)
      aliases.forEach(alias => categoryCache.set(alias, category))
    })
  }
  
  return categoryCache
}

/**
 * Get category aliases for better detection
 */
function getCategoryAliases(category: ThoughtCategory): string[] {
  const aliases: Record<ThoughtCategory, string[]> = {
    Goal: ['objective', 'target', 'aim'],
    Habit: ['routine', 'behavior', 'practice'],
    ProjectIdea: ['project', 'app', 'tool', 'business'],
    Task: ['todo', 'action', 'item'],
    Reminder: ['schedule', 'appointment', 'meeting'],
    Note: ['info', 'information', 'memo'],
    Insight: ['realization', 'discovery', 'reflection'],
    Learning: ['study', 'research', 'course'],
    Career: ['job', 'work', 'professional'],
    Metric: ['tracking', 'measurement', 'data'],
    Idea: ['concept', 'thought', 'brainstorm'],
    System: ['workflow', 'process', 'framework'],
    Automation: ['bot', 'script', 'automated'],
    Person: ['contact', 'people', 'relationship'],
    Sensitive: ['private', 'personal', 'confidential'],
    Uncategorized: ['other', 'misc', 'general']
  }
  
  return aliases[category] || []
}

/**
 * Optimized analysis prompt for better performance
 */
function getOptimizedAnalysisPrompt(): string {
  return `You are a high-performance personal AI assistant. Analyze this thought and respond with valid JSON only.

Categories: Goal, Habit, ProjectIdea, Task, Reminder, Note, Insight, Learning, Career, Metric, Idea, System, Automation, Person, Sensitive, Uncategorized

Response format:
{
  "category": "string",
  "subcategory": "string",
  "priority": "low|medium|high",
  "title": "string",
  "summary": "string",
  "actions": ["string"],
  "expandedThought": "string",
  "urgency": "low|medium|high",
  "sentiment": "positive|neutral|negative"
}`
}

/**
 * Sanitize and validate analysis response
 */
function sanitizeAnalysis(analysis: any, preselectedCategory?: string): ThoughtAnalysis {
  const categoryMapping = getOptimizedCategoryMapping()
  
  // Use preselected category if valid
  let finalCategory: ThoughtCategory = 'Uncategorized'
  if (preselectedCategory && categoryMapping.has(preselectedCategory.toLowerCase())) {
    finalCategory = categoryMapping.get(preselectedCategory.toLowerCase())!
  } else if (analysis.category) {
    const mappedCategory = categoryMapping.get(analysis.category.toLowerCase())
    finalCategory = mappedCategory || 'Uncategorized'
  }

  return {
    category: finalCategory,
    subcategory: typeof analysis.subcategory === 'string' ? analysis.subcategory.substring(0, 100) : undefined,
    priority: ['low', 'medium', 'high'].includes(analysis.priority) ? analysis.priority : 'medium',
    title: typeof analysis.title === 'string' ? analysis.title.substring(0, 200) : 'Untitled',
    summary: typeof analysis.summary === 'string' ? analysis.summary.substring(0, 1000) : '',
    actions: Array.isArray(analysis.actions) 
      ? analysis.actions.slice(0, 20).map((action: any) => 
          typeof action === 'string' ? action.substring(0, 500) : String(action).substring(0, 500)
        )
      : [],
    expandedThought: typeof analysis.expandedThought === 'string' 
      ? analysis.expandedThought.substring(0, 10000) 
      : analysis.summary || 'No additional details.',
    urgency: ['low', 'medium', 'high'].includes(analysis.urgency) ? analysis.urgency : 'medium',
    sentiment: ['positive', 'neutral', 'negative'].includes(analysis.sentiment) ? analysis.sentiment : 'neutral',
    // Legacy support
    type: getLegacyType(finalCategory)
  }
}

/**
 * Map new categories to legacy types for backward compatibility
 */
function getLegacyType(category: ThoughtCategory): string {
  const legacyMapping: Record<ThoughtCategory, string> = {
    Goal: 'task',
    Habit: 'task',
    ProjectIdea: 'project',
    Task: 'task',
    Reminder: 'task',
    Note: 'reflection',
    Insight: 'reflection',
    Learning: 'reflection',
    Career: 'task',
    Metric: 'reflection',
    Idea: 'idea',
    System: 'project',
    Automation: 'project',
    Person: 'reflection',
    Sensitive: 'vent',
    Uncategorized: 'reflection'
  }
  
  return legacyMapping[category] || 'reflection'
}

/**
 * Preload cache with common patterns for better initial performance
 */
export async function preloadCommonPatterns(): Promise<void> {
  const commonPatterns = [
    { text: "I need to", category: "Task" },
    { text: "I want to build", category: "ProjectIdea" },
    { text: "I should remember", category: "Reminder" },
    { text: "My goal is", category: "Goal" },
    { text: "I learned that", category: "Learning" }
  ]

  try {
    await Promise.allSettled(
      commonPatterns.map(pattern => 
        analyzeThoughtOptimized(pattern.text, pattern.category)
      )
    )
    
    performanceMonitor.record('cache_preload_complete', commonPatterns.length)
  } catch (error) {
    performanceMonitor.record('cache_preload_error', 1)
    console.warn('Failed to preload cache patterns:', error)
  }
}

/**
 * Get performance statistics for monitoring
 */
export function getClaudePerformanceStats() {
  const last5min = 300000
  const now = Date.now()
  
  return {
    apiCalls: performanceMonitor.getMetrics('claude_api_call', last5min).length,
    averageResponseTime: performanceMonitor.getAverage('claude_analysis_duration', last5min),
    cacheHitRate: calculateCacheHitRate(last5min),
    errorRate: calculateErrorRate(last5min),
    categories: getTopCategories(last5min),
    timestamp: now
  }
}

function calculateCacheHitRate(timeRangeMs: number): number {
  const hits = performanceMonitor.getMetrics('cache_hit', timeRangeMs).length
  const misses = performanceMonitor.getMetrics('cache_miss', timeRangeMs).length
  const total = hits + misses
  
  return total > 0 ? hits / total : 0
}

function calculateErrorRate(timeRangeMs: number): number {
  const errors = performanceMonitor.getMetrics('claude_parse_error', timeRangeMs).length + 
                performanceMonitor.getMetrics('claude_analysis_duration_error', timeRangeMs).length
  const total = performanceMonitor.getMetrics('claude_analysis_success', timeRangeMs).length + errors
  
  return total > 0 ? errors / total : 0
}

function getTopCategories(timeRangeMs: number): Array<{ category: string; count: number }> {
  const metrics = performanceMonitor.getMetrics('claude_analysis_success', timeRangeMs)
  const categoryCounts = new Map<string, number>()
  
  metrics.forEach(metric => {
    const category = metric.tags?.category || 'unknown'
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1)
  })
  
  return Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

// Auto-preload common patterns on module load (development only)
if (process.env.NODE_ENV === 'development') {
  preloadCommonPatterns().catch(console.warn)
}