'use client'

import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion'
import { ReactNode, useRef } from 'react'
import { cn } from '@/lib/utils'

interface HoverLiftProps {
  children: ReactNode
  className?: string
  liftHeight?: number
  rotationIntensity?: number
  scaleIntensity?: number
}

export function HoverLift({
  children,
  className,
  liftHeight = -8,
  rotationIntensity = 5,
  scaleIntensity = 1.02
}: HoverLiftProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useTransform(y, [-100, 100], [rotationIntensity, -rotationIntensity])
  const rotateY = useTransform(x, [-100, 100], [-rotationIntensity, rotationIntensity])

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5

    x.set(xPct * 100)
    y.set(yPct * 100)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={cn("relative cursor-pointer", className)}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d"
      }}
      whileHover={{
        y: liftHeight,
        scale: scaleIntensity,
        transition: { type: "spring", stiffness: 400, damping: 17 }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}

interface MagneticProps {
  children: ReactNode
  className?: string
  strength?: number
}

export function Magnetic({ children, className, strength = 0.4 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(0, { stiffness: 300, damping: 20 })
  const y = useSpring(0, { stiffness: 300, damping: 20 })

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const deltaX = (event.clientX - centerX) * strength
    const deltaY = (event.clientY - centerY) * strength

    x.set(deltaX)
    y.set(deltaY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}

interface GlitchTextProps {
  children: string
  className?: string
  intensity?: 'low' | 'medium' | 'high'
  trigger?: boolean
}

export function GlitchText({ 
  children, 
  className, 
  intensity = 'medium',
  trigger = false
}: GlitchTextProps) {
  const intensityMap = {
    low: { x: 2, duration: 0.1, iterations: 3 },
    medium: { x: 4, duration: 0.15, iterations: 5 },
    high: { x: 8, duration: 0.2, iterations: 8 }
  }

  const config = intensityMap[intensity]

  return (
    <motion.span
      className={cn("relative inline-block", className)}
      animate={trigger ? {
        x: Array.from({ length: config.iterations }, () => 
          Math.random() > 0.5 ? config.x : -config.x
        ),
      } : {}}
      transition={trigger ? {
        duration: config.duration,
        times: Array.from({ length: config.iterations }, (_, i) => i / (config.iterations - 1)),
        repeat: trigger ? 1 : 0
      } : {}}
    >
      {children}
    </motion.span>
  )
}

interface PulseProps {
  children: ReactNode
  className?: string
  color?: 'cyan' | 'purple' | 'pink' | 'green'
  intensity?: 'subtle' | 'normal' | 'strong'
}

export function Pulse({ 
  children, 
  className, 
  color = 'cyan',
  intensity = 'normal'
}: PulseProps) {
  const colorMap = {
    cyan: 'rgba(0,255,255,',
    purple: 'rgba(114,9,183,',
    pink: 'rgba(255,0,255,',
    green: 'rgba(57,255,20,'
  }

  const intensityMap = {
    subtle: { scale: [1, 1.02, 1], opacity: [0.3, 0.6, 0.3] },
    normal: { scale: [1, 1.05, 1], opacity: [0.4, 0.8, 0.4] },
    strong: { scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }
  }

  const config = intensityMap[intensity]
  const baseColor = colorMap[color]

  return (
    <motion.div
      className={cn("relative", className)}
      animate={{
        scale: config.scale,
        boxShadow: config.opacity.map(o => 
          `0 0 20px ${baseColor}${o}), 0 0 40px ${baseColor}${o * 0.7})`
        )
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  )
}

interface RippleProps {
  children: ReactNode
  className?: string
  color?: string
}

export function Ripple({ children, className, color = 'rgba(0,255,255,0.6)' }: RippleProps) {
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const element = event.currentTarget
    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const ripple = document.createElement('div')
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: ${color};
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-animation 0.6s ease-out;
      pointer-events: none;
      z-index: 1000;
    `

    const style = document.createElement('style')
    style.textContent = `
      @keyframes ripple-animation {
        to {
          transform: scale(2);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)

    element.appendChild(ripple)

    setTimeout(() => {
      ripple.remove()
      style.remove()
    }, 600)
  }

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

interface ShimmerProps {
  children: ReactNode
  className?: string
  color?: 'cyan' | 'purple' | 'pink' | 'green'
}

export function Shimmer({ children, className, color = 'cyan' }: ShimmerProps) {
  const colorMap = {
    cyan: 'from-transparent via-neon-cyan/30 to-transparent',
    purple: 'from-transparent via-cyber-purple/30 to-transparent',
    pink: 'from-transparent via-neon-pink/30 to-transparent',
    green: 'from-transparent via-neon-green/30 to-transparent'
  }

  return (
    <div className={cn("relative overflow-hidden group", className)}>
      {children}
      <motion.div
        className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100",
          colorMap[color]
        )}
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  )
}

interface FloatingProps {
  children: ReactNode
  className?: string
  intensity?: number
  speed?: number
}

export function Floating({ 
  children, 
  className, 
  intensity = 10,
  speed = 2
}: FloatingProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-intensity, intensity, -intensity],
        x: [-intensity/2, intensity/2, -intensity/2],
        rotate: [-1, 1, -1]
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  )
}