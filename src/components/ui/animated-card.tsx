'use client'

import { motion, useInView } from 'framer-motion'
import { ReactNode, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
  glitch?: boolean
  glow?: boolean
}

export function AnimatedCard({
  children,
  className,
  delay = 0,
  hover = true,
  glitch = false,
  glow = true
}: AnimatedCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative group",
        className
      )}
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={isInView ? { 
        opacity: 1, 
        y: 0, 
        rotateX: 0 
      } : {}}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.25, 0, 1]
      }}
      whileHover={hover ? {
        y: -5,
        rotateX: 5,
        scale: 1.02
      } : {}}
    >
      {/* Main card content */}
      <motion.div
        className={cn(
          "cyber-card relative z-10",
          glow && "shadow-[0_0_20px_rgba(0,255,255,0.1)]"
        )}
        whileHover={hover ? {
          boxShadow: glow ? "0 0 30px rgba(0,255,255,0.3)" : undefined
        } : {}}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>

      {/* Glitch overlay effect */}
      {glitch && (
        <motion.div
          className="absolute inset-0 cyber-card opacity-0 z-5"
          style={{
            background: "linear-gradient(45deg, rgba(255,0,255,0.1), rgba(0,255,255,0.1))",
            filter: "blur(1px)"
          }}
          animate={{
            opacity: [0, 0.3, 0],
            x: [0, -2, 2, 0],
            y: [0, 1, -1, 0]
          }}
          transition={{
            duration: 0.2,
            repeat: Infinity,
            repeatDelay: Math.random() * 3 + 2
          }}
        />
      )}

      {/* Corner scan lines */}
      <motion.div
        className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-neon-cyan opacity-0 group-hover:opacity-100"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.2 }}
      />
      <motion.div
        className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-neon-cyan opacity-0 group-hover:opacity-100"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.3 }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-neon-cyan opacity-0 group-hover:opacity-100"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.4 }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-neon-cyan opacity-0 group-hover:opacity-100"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.5 }}
      />
    </motion.div>
  )
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  delay = 0,
  className
}: {
  title: string
  value: string | number
  icon: any
  delay?: number
  className?: string
}) {
  return (
    <AnimatedCard delay={delay} className={className}>
      <div className="p-6">
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
        >
          <div>
            <motion.p
              className="text-sm font-medium text-neon-green font-mono tracking-wider"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: delay + 0.4 }}
            >
              {title}
            </motion.p>
            <motion.p
              className="text-3xl font-bold text-neon-cyan"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: delay + 0.5,
                type: "spring",
                stiffness: 400,
                damping: 17
              }}
            >
              {value}
            </motion.p>
          </div>
          <motion.div
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: delay + 0.6 }}
            whileHover={{ rotate: 360, scale: 1.1 }}
          >
            <Icon className="h-8 w-8 text-neon-purple" />
          </motion.div>
        </motion.div>
      </div>
    </AnimatedCard>
  )
}

export function ThoughtCard({
  children,
  delay = 0,
  className
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <AnimatedCard
      delay={delay}
      className={className}
      glitch={true}
      hover={true}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatedCard>
  )
}