'use client'

import { Dashboard as SharedDashboard } from './shared/components'
import { withErrorBoundary } from './shared/components'
import type { DashboardProps } from './shared/types'

const DashboardOptimized = ({ className, ...props }: DashboardProps) => {
  return (
    <SharedDashboard 
      className={className}
      {...props}
    />
  )
}

// Wrap with error boundary for production safety
export default withErrorBoundary(DashboardOptimized, {
  onError: (error) => {
    // Log to monitoring service in production
    console.error('Dashboard error:', error)
  },
  showRetry: true
})