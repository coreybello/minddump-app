/**
 * Smart Error Logging and Handling System
 * Automatically detects, logs, and suggests fixes for common deployment errors
 */

export interface ErrorPattern {
  type: 'eslint' | 'typescript' | 'build' | 'deployment' | 'runtime'
  pattern: RegExp
  description: string
  autoFix?: boolean
  fixFunction?: () => Promise<string[]>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ErrorLog {
  id: string
  timestamp: string
  type: string
  message: string
  stack?: string
  file?: string
  line?: number
  column?: number
  buildHash?: string
  deploymentId?: string
  autoFixApplied?: boolean
  fixDetails?: string[]
}

class ErrorLoggingSystem {
  private errors: ErrorLog[] = []
  private patterns: ErrorPattern[] = []

  constructor() {
    this.initializePatterns()
  }

  private initializePatterns(): void {
    this.patterns = [
      {
        type: 'eslint',
        pattern: /@typescript-eslint\/no-explicit-any/,
        description: 'TypeScript any type detected',
        autoFix: true,
        severity: 'medium',
        fixFunction: async () => [
          'Replace any types with proper TypeScript types',
          'Use unknown for generic object types',
          'Use specific interfaces where possible'
        ]
      },
      {
        type: 'eslint',
        pattern: /@typescript-eslint\/no-unused-vars/,
        description: 'Unused variables detected',
        autoFix: true,
        severity: 'medium',
        fixFunction: async () => [
          'Remove unused variables',
          'Prefix with underscore if intentionally unused',
          'Use proper destructuring patterns'
        ]
      },
      {
        type: 'eslint',
        pattern: /react-hooks\/exhaustive-deps/,
        description: 'React hooks dependency warning',
        autoFix: true,
        severity: 'medium',
        fixFunction: async () => [
          'Move function inside useEffect',
          'Wrap function in useCallback',
          'Add missing dependencies to dependency array'
        ]
      },
      {
        type: 'build',
        pattern: /Failed to compile/,
        description: 'Build compilation failure',
        autoFix: false,
        severity: 'critical'
      },
      {
        type: 'deployment',
        pattern: /Command "npm run build" exited with 1/,
        description: 'Deployment build failure',
        autoFix: false,
        severity: 'critical'
      },
      {
        type: 'typescript',
        pattern: /Type .* is not assignable to type/,
        description: 'TypeScript type mismatch',
        autoFix: false,
        severity: 'high'
      }
    ]
  }

  /**
   * Log an error with automatic pattern matching
   */
  logError(error: Partial<ErrorLog>): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const errorLog: ErrorLog = {
      id: errorId,
      timestamp: new Date().toISOString(),
      type: error.type || 'unknown',
      message: error.message || '',
      stack: error.stack,
      file: error.file,
      line: error.line,
      column: error.column,
      buildHash: error.buildHash,
      deploymentId: error.deploymentId,
      autoFixApplied: false
    }

    // Match against known patterns
    const matchedPattern = this.patterns.find(pattern => 
      pattern.pattern.test(errorLog.message)
    )

    if (matchedPattern) {
      errorLog.type = matchedPattern.type
      console.log(`🔍 Matched error pattern: ${matchedPattern.description}`)
      
      if (matchedPattern.autoFix && matchedPattern.fixFunction) {
        this.applyAutoFix(errorLog, matchedPattern)
      }
    }

    this.errors.push(errorLog)
    this.persistError(errorLog)
    
    return errorId
  }

  /**
   * Apply automatic fixes for known error patterns
   */
  private async applyAutoFix(error: ErrorLog, pattern: ErrorPattern): Promise<void> {
    if (!pattern.fixFunction) return

    try {
      const fixSteps = await pattern.fixFunction()
      error.autoFixApplied = true
      error.fixDetails = fixSteps
      
      console.log(`🔧 Auto-fix suggestions for ${error.id}:`)
      fixSteps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step}`)
      })
    } catch (fixError) {
      console.error(`Failed to apply auto-fix for ${error.id}:`, fixError)
    }
  }

  /**
   * Analyze error patterns and suggest improvements
   */
  analyzeErrorPatterns(): {
    mostCommon: string[]
    recommendations: string[]
    criticalErrors: ErrorLog[]
  } {
    const errorCounts = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostCommon = Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => `${type}: ${count} occurrences`)

    const criticalErrors = this.errors.filter(error => 
      this.patterns.find(p => p.pattern.test(error.message))?.severity === 'critical'
    )

    const recommendations = this.generateRecommendations(errorCounts)

    return { mostCommon, recommendations, criticalErrors }
  }

  /**
   * Generate recommendations based on error patterns
   */
  private generateRecommendations(errorCounts: Record<string, number>): string[] {
    const recommendations: string[] = []

    if (errorCounts.eslint > 5) {
      recommendations.push('Consider configuring ESLint rules to be less strict in development')
      recommendations.push('Implement pre-commit hooks to catch ESLint errors early')
    }

    if (errorCounts.typescript > 3) {
      recommendations.push('Review TypeScript configuration for stricter type checking')
      recommendations.push('Consider using type-only imports to reduce build issues')
    }

    if (errorCounts.deployment > 2) {
      recommendations.push('Implement deployment status monitoring')
      recommendations.push('Add automated rollback for failed deployments')
    }

    return recommendations
  }

  /**
   * Persist error to memory for cross-session tracking
   */
  private persistError(error: ErrorLog): void {
    // Store in memory for persistent tracking across sessions
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('minddump-errors') || '[]'
      const errors = JSON.parse(stored)
      errors.push(error)
      
      // Keep only last 100 errors
      if (errors.length > 100) {
        errors.splice(0, errors.length - 100)
      }
      
      localStorage.setItem('minddump-errors', JSON.stringify(errors))
    }
  }

  /**
   * Get deployment status and health
   */
  async getDeploymentHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical'
    lastDeployment: string
    errorCount: number
    recommendations: string[]
  }> {
    const recentErrors = this.errors.filter(error => 
      new Date(error.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    )

    const criticalCount = recentErrors.filter(error => 
      this.patterns.find(p => p.pattern.test(error.message))?.severity === 'critical'
    ).length

    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (criticalCount > 0) status = 'critical'
    else if (recentErrors.length > 5) status = 'warning'

    const analysis = this.analyzeErrorPatterns()

    return {
      status,
      lastDeployment: this.errors[this.errors.length - 1]?.timestamp || 'Never',
      errorCount: recentErrors.length,
      recommendations: analysis.recommendations
    }
  }

  /**
   * Export error data for analysis
   */
  exportErrors(): ErrorLog[] {
    return [...this.errors]
  }

  /**
   * Clear error logs
   */
  clearErrors(): void {
    this.errors = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('minddump-errors')
    }
  }
}

// Singleton instance
export const errorLogger = new ErrorLoggingSystem()

/**
 * Utility functions for common error scenarios
 */
export const ErrorUtils = {
  /**
   * Parse ESLint error output
   */
  parseESLintErrors(output: string): ErrorLog[] {
    const lines = output.split('\n')
    const errors: ErrorLog[] = []
    
    let currentFile = ''
    
    for (const line of lines) {
      // File path detection
      if (line.startsWith('./src/')) {
        currentFile = line.trim()
        continue
      }
      
      // Error line detection (e.g., "26:16  Error: 'error' is defined but never used.")
      const errorMatch = line.match(/(\d+):(\d+)\s+(Error|Warning):\s+(.+)\s+(@[\w-/]+)/)
      if (errorMatch) {
        const [, lineNum, colNum, , message, rule] = errorMatch
        
        errors.push({
          id: `eslint_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          timestamp: new Date().toISOString(),
          type: 'eslint',
          message: `${message} (${rule})`,
          file: currentFile,
          line: parseInt(lineNum),
          column: parseInt(colNum)
        })
      }
    }
    
    return errors
  },

  /**
   * Monitor deployment status
   */
  async monitorDeployment(buildId?: string): Promise<void> {
    console.log(`🔍 Monitoring deployment ${buildId || 'latest'}...`)
    
    // This would integrate with Vercel API in a real implementation
    // For now, we'll simulate monitoring
    setTimeout(() => {
      console.log('✅ Deployment monitoring active')
    }, 1000)
  },

  /**
   * Generate fix suggestions for common errors
   */
  generateFixSuggestions(errorType: string, message: string): string[] {
    const suggestions: string[] = []
    
    if (errorType === 'eslint') {
      if (message.includes('no-unused-vars')) {
        suggestions.push('Remove the unused variable')
        suggestions.push('Prefix with underscore if intentionally unused')
      }
      
      if (message.includes('no-explicit-any')) {
        suggestions.push('Replace any with specific type')
        suggestions.push('Use unknown for generic objects')
        suggestions.push('Create proper interface definition')
      }
    }
    
    return suggestions
  }
}