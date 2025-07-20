'use client'

import { lazy, Suspense, ComponentType } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Brain, Activity, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

// Lazy load heavy components for better initial page load
export const LazyPerformanceDashboard = lazy(() => import('./PerformanceDashboard'))
export const LazyVoiceInputOptimized = lazy(() => import('./VoiceInputOptimized'))

// Loading components with cyberpunk theme
const LoadingSpinner = ({ icon: Icon, text }: { icon: ComponentType<any>, text: string }) => (
  <Card className="cyber-card">
    <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
          scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' }
        }}
        className="relative"
      >
        <Icon className="h-8 w-8 text-neon-cyan" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-neon-cyan/30"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </motion.div>
      
      <div className="text-center">
        <motion.div
          className="text-neon-cyan font-mono text-sm"
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {text}
        </motion.div>
        
        <div className="flex justify-center mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 bg-neon-green rounded-full mx-1"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
)

// Performance Dashboard Loading
const PerformanceDashboardLoading = () => (
  <LoadingSpinner 
    icon={Activity} 
    text="INITIALIZING_PERFORMANCE_MONITOR..." 
  />
)

// Voice Input Loading
const VoiceInputLoading = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex items-center justify-center p-4"
  >
    <div className="flex items-center gap-3 text-neon-cyan font-mono text-sm">
      <motion.div
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      >
        <Brain className="h-4 w-4" />
      </motion.div>
      LOADING_VOICE_INTERFACE...
    </div>
  </motion.div>
)

// Error boundary fallback for lazy components
const LazyErrorFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
  <Card className="cyber-card border-red-500/50">
    <CardContent className="p-6 text-center space-y-4">
      <div className="text-red-400 font-mono text-sm">
        COMPONENT_LOAD_ERROR
      </div>
      
      <div className="text-red-300/70 text-xs font-mono max-w-md mx-auto">
        {error.message || 'Failed to load component'}
      </div>
      
      <motion.button
        onClick={retry}
        className="px-4 py-2 bg-red-900/50 border border-red-500/50 text-red-300 font-mono text-xs rounded hover:bg-red-900/70 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        RETRY_LOAD
      </motion.button>
    </CardContent>
  </Card>
)

// Higher-order component for lazy loading with error boundary
const withLazyLoading = <P extends object>(
  LazyComponent: ComponentType<P>,
  LoadingComponent: ComponentType,
  componentName: string
) => {
  return (props: P) => {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <ErrorBoundaryWrapper componentName={componentName}>
          <LazyComponent {...props} />
        </ErrorBoundaryWrapper>
      </Suspense>
    )
  }
}

// Simple error boundary for lazy components
class ErrorBoundaryWrapper extends React.Component<
  { children: React.ReactNode; componentName: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; componentName: string }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Lazy component error in ${this.props.componentName}:`, error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <LazyErrorFallback error={this.state.error} retry={this.retry} />
    }

    return this.props.children
  }
}

// Export wrapped components
export const PerformanceDashboard = withLazyLoading(
  LazyPerformanceDashboard,
  PerformanceDashboardLoading,
  'PerformanceDashboard'
)

export const VoiceInputOptimized = withLazyLoading(
  LazyVoiceInputOptimized,
  VoiceInputLoading,
  'VoiceInputOptimized'
)

// Preload critical components after initial render
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback for non-critical preloading
    const preload = () => {
      import('./PerformanceDashboard').catch(console.warn)
      import('./VoiceInputOptimized').catch(console.warn)
    }

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(preload)
    } else {
      setTimeout(preload, 2000) // Fallback for browsers without requestIdleCallback
    }
  }
}

// Intersection Observer hook for lazy loading based on visibility
export const useLazyLoad = (elementRef: React.RefObject<Element>) => {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(element)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px' // Start loading 50px before element comes into view
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef])

  return isVisible
}

// Component for conditionally rendering heavy components based on viewport
export const LazySection = ({ 
  children, 
  fallback, 
  className = '' 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string 
}) => {
  const sectionRef = React.useRef<HTMLDivElement>(null)
  const isVisible = useLazyLoad(sectionRef)

  return (
    <div ref={sectionRef} className={className}>
      {isVisible ? children : (fallback || <div className="h-32" />)}
    </div>
  )
}