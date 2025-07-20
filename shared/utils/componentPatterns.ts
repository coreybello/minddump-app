import React, { ReactElement, cloneElement, isValidElement } from 'react'
import { cn } from './cn'

/**
 * Component composition utilities for better reusability and performance
 */

// Higher-order component for adding consistent loading states
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  LoadingComponent?: React.ComponentType
) {
  return function LoadingWrapper(props: P & { isLoading?: boolean }) {
    const { isLoading, ...componentProps } = props
    
    if (isLoading) {
      return LoadingComponent ? <LoadingComponent /> : (
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg" />
        </div>
      )
    }
    
    return <Component {...(componentProps as P)} />
  }
}

// Compound component pattern helper
export function createCompoundComponent<T extends Record<string, React.ComponentType<any>>>(
  components: T
) {
  return components
}

// Render prop pattern helper
export interface RenderPropPattern<T> {
  children: (props: T) => React.ReactNode
}

// Slot pattern for flexible component composition
export interface SlotProps {
  children?: React.ReactNode
  className?: string
}

export function Slot({ children, className }: SlotProps) {
  if (isValidElement(children)) {
    return cloneElement(children, {
      className: cn(children.props.className, className)
    })
  }
  
  return <div className={className}>{children}</div>
}

// Performance optimization helpers
export const memo = React.memo
export const useMemo = React.useMemo
export const useCallback = React.useCallback

// Component variant generator
export function createVariants<T extends Record<string, any>>(
  baseComponent: React.ComponentType<any>,
  variants: T
) {
  const VariantComponents = {} as Record<keyof T, React.ComponentType<any>>
  
  Object.entries(variants).forEach(([key, variantProps]) => {
    VariantComponents[key as keyof T] = (props: any) => 
      React.createElement(baseComponent, { ...variantProps, ...props })
  })
  
  return VariantComponents
}

// Consistent prop forwarding
export function forwardPropsExcept<T extends Record<string, any>>(
  props: T,
  except: (keyof T)[]
): Omit<T, keyof T> {
  const forwarded = { ...props }
  except.forEach(key => delete forwarded[key])
  return forwarded
}

// Theme-aware component wrapper
export function withTheme<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ThemedComponent(props: P & { theme?: 'light' | 'dark' | 'cyber' }) {
    const { theme = 'cyber', ...componentProps } = props
    
    return (
      <div className={cn(
        theme === 'cyber' && 'cyber-theme',
        theme === 'dark' && 'dark',
        theme === 'light' && 'light'
      )}>
        <Component {...(componentProps as P)} />
      </div>
    )
  }
}

// Accessibility helpers
export function withA11y<P extends object>(
  Component: React.ComponentType<P>
) {
  return function A11yComponent(props: P & { 
    'aria-label'?: string
    'aria-describedby'?: string
    role?: string
  }) {
    return <Component {...props} />
  }
}

// Performance monitoring wrapper
export function withPerformance<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceWrapper(props: P) {
    React.useEffect(() => {
      const startTime = performance.now()
      
      return () => {
        const endTime = performance.now()
        if (process.env.NODE_ENV === 'development') {
          console.log(`${componentName} render time: ${endTime - startTime}ms`)
        }
      }
    })
    
    return <Component {...props} />
  }
}