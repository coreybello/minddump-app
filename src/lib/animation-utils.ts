// Animation performance utilities and configurations

export const ANIMATION_CONFIG = {
  // Easing functions for consistent motion
  easing: {
    smooth: [0.25, 0.25, 0, 1],
    snappy: [0.25, 0.46, 0.45, 0.94],
    bounce: [0.68, -0.55, 0.265, 1.55],
    cyber: [0.25, 0.1, 0.25, 1]
  },
  
  // Duration presets
  duration: {
    instant: 0.1,
    fast: 0.3,
    normal: 0.5,
    slow: 0.8,
    epic: 1.2
  },
  
  // Spring configurations
  spring: {
    gentle: { stiffness: 300, damping: 30 },
    snappy: { stiffness: 400, damping: 17 },
    bouncy: { stiffness: 600, damping: 15 },
    wobbly: { stiffness: 180, damping: 12 }
  }
}

// Check if user prefers reduced motion
export const shouldReduceMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Get optimized animation config based on device performance
export const getOptimizedConfig = () => {
  if (typeof window === 'undefined') return ANIMATION_CONFIG

  // Simple performance detection
  const isLowPerformance = navigator.hardwareConcurrency <= 2 || 
                          /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  if (shouldReduceMotion() || isLowPerformance) {
    return {
      ...ANIMATION_CONFIG,
      duration: {
        instant: 0.01,
        fast: 0.1,
        normal: 0.2,
        slow: 0.3,
        epic: 0.4
      }
    }
  }

  return ANIMATION_CONFIG
}

// Intersection Observer for scroll animations
export const createScrollObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  if (typeof window === 'undefined') return null

  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '-50px 0px',
    ...options
  }

  return new IntersectionObserver(callback, defaultOptions)
}

// Animation variants for common patterns
export const VARIANTS = {
  // Page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 1.05 }
  },
  
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  
  fadeInUp: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 }
  },
  
  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  
  // Slide animations
  slideInLeft: {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100 }
  },
  
  slideInRight: {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 }
  },
  
  // Stagger animations
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  },
  
  // Cyber-specific animations
  cyberGlitch: {
    initial: { opacity: 0, skew: 0 },
    animate: { 
      opacity: 1, 
      skew: 0,
      transition: {
        duration: 0.1,
        repeat: 3,
        repeatType: "reverse" as const
      }
    }
  },
  
  neuralPulse: {
    animate: {
      scale: [1, 1.05, 1],
      boxShadow: [
        "0 0 10px rgba(0,255,255,0.3)",
        "0 0 25px rgba(0,255,255,0.8)",
        "0 0 10px rgba(0,255,255,0.3)"
      ]
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Performance monitoring
export class AnimationPerformanceMonitor {
  private frameCount = 0
  private lastTime = 0
  private fps = 0
  private isMonitoring = false

  startMonitoring() {
    if (this.isMonitoring) return
    this.isMonitoring = true
    this.measureFPS()
  }

  stopMonitoring() {
    this.isMonitoring = false
  }

  getFPS() {
    return this.fps
  }

  private measureFPS() {
    if (!this.isMonitoring) return

    const now = performance.now()
    this.frameCount++

    if (now >= this.lastTime + 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime))
      this.frameCount = 0
      this.lastTime = now
    }

    requestAnimationFrame(() => this.measureFPS())
  }

  shouldOptimizeAnimations() {
    return this.fps < 30
  }
}

// Global performance monitor instance
export const performanceMonitor = new AnimationPerformanceMonitor()

// Animation utilities
export const animationUtils = {
  // Delay utility for staggered animations
  getStaggerDelay: (index: number, baseDelay = 0.1) => index * baseDelay,
  
  // Random delay for organic feel
  getRandomDelay: (min = 0, max = 0.5) => Math.random() * (max - min) + min,
  
  // Calculate dynamic duration based on distance
  getDynamicDuration: (distance: number, speed = 1000) => Math.max(0.2, distance / speed),
  
  // Create responsive animation config
  getResponsiveConfig: (baseConfig: any) => {
    const { duration } = getOptimizedConfig()
    return {
      ...baseConfig,
      transition: {
        ...baseConfig.transition,
        duration: duration.normal
      }
    }
  }
}

// Device-specific optimizations
export const deviceOptimizations = {
  // Check if device supports hardware acceleration
  supportsHardwareAcceleration: () => {
    if (typeof window === 'undefined') return false
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  },
  
  // Get device pixel ratio for sharp animations
  getPixelRatio: () => typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  
  // Check for touch device
  isTouchDevice: () => typeof window !== 'undefined' && 'ontouchstart' in window,
  
  // Get viewport dimensions for responsive animations
  getViewportSize: () => {
    if (typeof window === 'undefined') return { width: 1920, height: 1080 }
    return {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }
}