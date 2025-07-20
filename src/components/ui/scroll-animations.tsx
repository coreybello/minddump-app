'use client'

import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { ReactNode, useRef } from 'react'
import { cn } from '@/lib/utils'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  threshold?: number
}

export function ScrollReveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  threshold = 0.1
}: ScrollRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { 
    once: true, 
    amount: threshold 
  })

  const variants = {
    up: { y: 50, opacity: 0 },
    down: { y: -50, opacity: 0 },
    left: { x: -50, opacity: 0 },
    right: { x: 50, opacity: 0 }
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={variants[direction]}
      animate={isInView ? { x: 0, y: 0, opacity: 1 } : variants[direction]}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.25, 0, 1]
      }}
    >
      {children}
    </motion.div>
  )
}

export function ParallaxContainer({
  children,
  className,
  speed = 0.5
}: {
  children: ReactNode
  className?: string
  speed?: number
}) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, -50 * speed])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ y, opacity }}
    >
      {children}
    </motion.div>
  )
}

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-cyber-purple to-neon-pink z-50 origin-left"
      style={{ scaleX: scrollYProgress }}
    />
  )
}

export function FloatingElements() {
  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Floating cyber particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-neon-cyan rounded-full opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.2, 0.5, 0.2],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2
          }}
        />
      ))}

      {/* Floating neural nodes */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`node-${i}`}
          className="absolute w-1 h-1 bg-neon-pink rounded-full opacity-30"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
          animate={{
            y: [-30, 30, -30],
            x: [-15, 15, -15],
            opacity: [0.1, 0.4, 0.1]
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 3
          }}
        />
      ))}
    </div>
  )
}

export function TextScramble({
  text,
  className,
  trigger = true
}: {
  text: string
  className?: string
  trigger?: boolean
}) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?"
  
  return (
    <motion.span
      className={cn("font-mono", className)}
      animate={trigger ? {
        opacity: [0, 1],
      } : {}}
      transition={{ duration: 0.8 }}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          animate={trigger ? {
            opacity: [0, 0.3, 1],
          } : {}}
          transition={{
            duration: 0.1,
            delay: index * 0.05,
            repeat: trigger ? 3 : 0,
            onUpdate: (latest) => {
              if (latest.opacity < 1 && Math.random() > 0.7) {
                // Occasionally show random character during animation
                const randomChar = characters[Math.floor(Math.random() * characters.length)]
                return randomChar
              }
              return char
            }
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  )
}

export function CyberBorder({
  children,
  className,
  animate = true
}: {
  children: ReactNode
  className?: string
  animate?: boolean
}) {
  return (
    <div className={cn("relative", className)}>
      {/* Animated border lines */}
      <motion.div
        className="absolute inset-0 border-2 border-neon-cyan opacity-50"
        animate={animate ? {
          opacity: [0.3, 0.8, 0.3],
          boxShadow: [
            "0 0 5px rgba(0,255,255,0.3)",
            "0 0 20px rgba(0,255,255,0.8)",
            "0 0 5px rgba(0,255,255,0.3)"
          ]
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Corner elements */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-pink" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-pink" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-pink" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-pink" />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}