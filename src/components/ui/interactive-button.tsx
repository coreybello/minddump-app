'use client'

import { motion, MotionProps } from 'framer-motion'
import { ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InteractiveButtonProps extends Omit<MotionProps, 'children'> {
  children: ReactNode
  variant?: 'cyber' | 'neon' | 'ghost' | 'pulse'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  className?: string
}

export const InteractiveButton = forwardRef<HTMLButtonElement, InteractiveButtonProps>(({
  children,
  variant = 'cyber',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className,
  ...motionProps
}, ref) => {
  const baseClasses = "relative overflow-hidden font-mono font-bold tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
  
  const variants = {
    cyber: "bg-gradient-to-r from-cyber-purple to-midnight-purple border-2 border-neon-cyan text-neon-cyan hover:bg-gradient-to-r hover:from-neon-cyan hover:to-cyber-purple hover:text-dark-bg",
    neon: "bg-transparent border-2 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-dark-bg hover:shadow-[0_0_25px_var(--neon-pink)]",
    ghost: "bg-transparent text-neon-green hover:bg-neon-green/10 hover:shadow-[0_0_15px_var(--neon-green)]",
    pulse: "bg-neon-cyan text-dark-bg hover:shadow-[0_0_30px_var(--neon-cyan)] animate-pulse"
  }

  const sizes = {
    sm: "px-4 py-2 text-sm clip-path-button-sm",
    md: "px-6 py-3 text-base clip-path-button",
    lg: "px-8 py-4 text-lg clip-path-button-lg"
  }

  return (
    <motion.button
      ref={ref}
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ 
        scale: disabled ? 1 : 1.05,
        y: disabled ? 0 : -2
      }}
      whileTap={{ 
        scale: disabled ? 1 : 0.95,
        y: disabled ? 0 : 0
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
      {...motionProps}
    >
      {/* Scan line effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
        animate={{
          x: disabled ? '-100%' : ['100%', '200%']
        }}
        transition={{
          duration: 2,
          repeat: disabled ? 0 : Infinity,
          ease: "linear"
        }}
      />

      {/* Button content */}
      <motion.span
        className="relative z-10 flex items-center justify-center gap-2"
        animate={loading ? { opacity: [1, 0.5, 1] } : {}}
        transition={loading ? { duration: 1, repeat: Infinity } : {}}
      >
        {loading && (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
        {children}
      </motion.span>

      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 opacity-0 bg-gradient-to-r from-neon-cyan/20 to-neon-pink/20 blur-sm"
        whileHover={{ opacity: disabled ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  )
})

InteractiveButton.displayName = "InteractiveButton"

// Floating Action Button variant
export function FloatingActionButton({
  children,
  onClick,
  className,
  ...props
}: Omit<InteractiveButtonProps, 'variant' | 'size'>) {
  return (
    <motion.button
      className={cn(
        "fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-cyber-purple to-neon-cyan text-white shadow-[0_0_20px_var(--neon-cyan)] z-50",
        "flex items-center justify-center font-bold",
        className
      )}
      onClick={onClick}
      whileHover={{ 
        scale: 1.1,
        rotate: 180,
        shadow: "0 0 30px var(--neon-cyan)"
      }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
      {...props}
    >
      {children}
    </motion.button>
  )
}