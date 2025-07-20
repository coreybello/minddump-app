import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import type { ErrorBoundaryState, ComponentError } from '../types/minddump'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: ComponentError) => void
  showRetry?: boolean
  className?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const componentError: ComponentError = {
      message: error.message,
      code: error.name,
      timestamp: new Date().toISOString(),
      component: errorInfo.componentStack || 'Unknown'
    }

    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call optional error handler
    this.props.onError?.(componentError)

    this.setState({
      hasError: true,
      error,
      errorInfo
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className={`p-4 ${this.props.className || ''}`}>
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  {this.state.error?.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              {this.props.showRetry !== false && (
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default ErrorBoundary