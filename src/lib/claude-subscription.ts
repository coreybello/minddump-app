// Claude Subscription Integration
// This module provides integration with Claude subscription for users with Claude Pro/Max plans
// instead of using the Anthropic API directly

export interface ThoughtAnalysis {
  type: 'idea' | 'task' | 'project' | 'vent' | 'reflection'
  title?: string
  summary?: string
  actions: string[]
  expandedThought: string
  urgency: 'low' | 'medium' | 'high'
  sentiment?: 'positive' | 'neutral' | 'negative'
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

// NOTE: Direct Claude subscription integration requires special handling
// Since we can't directly access Claude Pro/Max subscription from web apps,
// we'll implement a hybrid approach that optimizes for subscription users

export class ClaudeSubscriptionManager {
  private fallbackToAPI: boolean = true
  
  constructor() {
    // Check if user has Claude subscription preference
    this.fallbackToAPI = !this.hasSubscriptionPreference()
  }

  private hasSubscriptionPreference(): boolean {
    // Check for subscription preference in localStorage or environment
    if (typeof window !== 'undefined') {
      return localStorage.getItem('claude-subscription-mode') === 'true'
    }
    return process.env.CLAUDE_SUBSCRIPTION_MODE === 'true'
  }

  async analyzeThought(rawText: string): Promise<ThoughtAnalysis> {
    // For Claude subscription users, we recommend using Claude directly
    // and then inputting the analysis into the app
    
    if (this.shouldUseSubscriptionFlow()) {
      return this.handleSubscriptionFlow(rawText)
    }
    
    // Fallback to API integration
    return this.fallbackToAPIAnalysis(rawText)
  }

  private shouldUseSubscriptionFlow(): boolean {
    return !this.fallbackToAPI && typeof window !== 'undefined'
  }

  private async handleSubscriptionFlow(rawText: string): Promise<ThoughtAnalysis> {
    // For subscription users, provide a guided workflow
    const analysisPrompt = this.generateAnalysisPrompt(rawText)
    
    // Store the prompt and raw text for user to process in Claude
    if (typeof window !== 'undefined') {
      localStorage.setItem('pending-analysis', JSON.stringify({
        rawText,
        prompt: analysisPrompt,
        timestamp: Date.now()
      }))
      
      // Trigger subscription workflow UI
      this.triggerSubscriptionWorkflow(analysisPrompt)
    }
    
    // Return a placeholder that will be replaced by user input
    return {
      type: 'idea',
      summary: 'Processing with Claude subscription...',
      actions: [],
      expandedThought: rawText,
      urgency: 'medium'
    }
  }

  private generateAnalysisPrompt(rawText: string): string {
    return `You are a personal AI assistant that processes unstructured thoughts. Analyze this thought and respond in JSON format:

INPUT: "${rawText}"

Provide analysis in this JSON structure:
{
  "type": "project" | "idea" | "task" | "vent" | "reflection",
  "title": "...",
  "summary": "...",
  "actions": ["action1", "action2"],
  "expandedThought": "...",
  "urgency": "low" | "medium" | "high",
  "sentiment": "positive" | "neutral" | "negative",
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

Only include markdown, github, techStack, and features for project-type thoughts.`
  }

  private triggerSubscriptionWorkflow(prompt: string) {
    // Create a modal or notification for subscription users
    const event = new CustomEvent('claude-subscription-prompt', {
      detail: { prompt }
    })
    window.dispatchEvent(event)
  }

  private async fallbackToAPIAnalysis(rawText: string): Promise<ThoughtAnalysis> {
    // Import the API-based analysis as fallback
    try {
      const { analyzeThought } = await import('./claude')
      return await analyzeThought(rawText)
    } catch (error) {
      console.error('Error with API fallback:', error)
      
      // Ultimate fallback - basic analysis
      return {
        type: 'idea',
        summary: rawText.slice(0, 100) + '...',
        actions: [],
        expandedThought: rawText,
        urgency: 'medium'
      }
    }
  }

  // Method for subscription users to input their Claude analysis
  processSubscriptionAnalysis(analysisJson: string): ThoughtAnalysis {
    try {
      const analysis = JSON.parse(analysisJson) as ThoughtAnalysis
      
      // Clear pending analysis
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending-analysis')
      }
      
      return analysis
    } catch (error) {
      console.error('Error parsing subscription analysis:', error)
      throw new Error('Invalid analysis format. Please ensure you provided valid JSON.')
    }
  }

  // Toggle subscription mode
  setSubscriptionMode(enabled: boolean) {
    this.fallbackToAPI = !enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('claude-subscription-mode', enabled.toString())
    }
  }

  // Check if there's a pending analysis for subscription workflow
  getPendingAnalysis(): { rawText: string; prompt: string; timestamp: number } | null {
    if (typeof window !== 'undefined') {
      const pending = localStorage.getItem('pending-analysis')
      return pending ? JSON.parse(pending) : null
    }
    return null
  }
}

// Export singleton instance
export const claudeSubscriptionManager = new ClaudeSubscriptionManager()

// Helper function for backward compatibility
export async function analyzeThoughtWithSubscription(rawText: string): Promise<ThoughtAnalysis> {
  return claudeSubscriptionManager.analyzeThought(rawText)
}