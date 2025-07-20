'use client'

import { MindDumpInput as SharedMindDumpInput } from './shared/components'
import { withErrorBoundary } from './shared/components'
import type { MindDumpInputProps } from './shared/types'

const MindDumpInputOptimized = ({ 
  onSubmit, 
  isProcessing, 
  className,
  ...props 
}: MindDumpInputProps) => {
  return (
    <SharedMindDumpInput
      onSubmit={onSubmit}
      isProcessing={isProcessing}
      className={className}
      placeholder="Share your thoughts, ideas, tasks, or reflections. The AI will analyze and organize them automatically."
      maxLength={2000}
      {...props}
    />
  )
}

// Wrap with error boundary for production safety
export default withErrorBoundary(MindDumpInputOptimized, {
  onError: (error) => {
    // Log to monitoring service in production
    console.error('MindDumpInput error:', error)
  },
  showRetry: true
})