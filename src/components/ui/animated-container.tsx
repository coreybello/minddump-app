'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedContainerProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  once?: boolean
}

export function AnimatedContainer({
  children,
  className = '',
  delay = 0,
  duration = 0.6,
  direction = 'up',
  once = true
}: AnimatedContainerProps) {
  const variants = {
    up: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -50 }
    },
    down: {
      initial: { opacity: 0, y: -50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 50 }
    },
    left: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 50 }
    },
    right: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -50 }
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    }
  }

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[direction]}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.25, 0, 1]
      }}
      viewport={{ once }}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedList({
  children,
  className = '',
  stagger = 0.1
}: {
  children: ReactNode[]
  className?: string
  stagger?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger
          }
        }
      }}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.5,
                ease: [0.25, 0.25, 0, 1]
              }
            }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

export function AnimatedPresenceWrapper({
  children,
  mode = 'wait'
}: {
  children: ReactNode
  mode?: 'wait' | 'sync' | 'popLayout'
}) {
  return (
    <AnimatePresence mode={mode}>
      {children}
    </AnimatePresence>
  )
}