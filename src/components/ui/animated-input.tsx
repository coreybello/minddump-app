'use client'

import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { forwardRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  icon?: React.ReactNode
  showPasswordToggle?: boolean
  variant?: 'cyber' | 'neon' | 'ghost'
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(({
  className,
  type = 'text',
  label,
  error,
  success,
  icon,
  showPasswordToggle = false,
  variant = 'cyber',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [hasValue, setHasValue] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const rotateX = useTransform(mouseY, [-100, 100], [10, -10])
  const rotateY = useTransform(mouseX, [-100, 100], [-10, 10])

  useEffect(() => {
    setHasValue(Boolean(props.value || props.defaultValue))
  }, [props.value, props.defaultValue])

  const variants = {
    cyber: {
      base: "bg-gradient-to-r from-midnight-purple/50 to-deep-purple/50 border-2 border-cyber-purple/50 text-neon-cyan",
      focus: "border-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.3)]",
      error: "border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.3)]",
      success: "border-green-500 shadow-[0_0_20px_rgba(0,255,0,0.3)]"
    },
    neon: {
      base: "bg-transparent border-2 border-neon-pink/50 text-neon-pink",
      focus: "border-neon-pink shadow-[0_0_25px_rgba(255,0,255,0.4)]",
      error: "border-red-400 shadow-[0_0_25px_rgba(255,0,0,0.4)]",
      success: "border-green-400 shadow-[0_0_25px_rgba(0,255,0,0.4)]"
    },
    ghost: {
      base: "bg-transparent border-2 border-neon-green/30 text-neon-green",
      focus: "border-neon-green shadow-[0_0_15px_rgba(57,255,20,0.3)]",
      error: "border-red-400 shadow-[0_0_15px_rgba(255,0,0,0.3)]",
      success: "border-green-400 shadow-[0_0_15px_rgba(0,255,0,0.3)]"
    }
  }

  const currentVariant = variants[variant]
  const inputType = showPasswordToggle && type === 'password' 
    ? (showPassword ? 'text' : 'password') 
    : type

  return (
    <motion.div
      className="relative group"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2
        mouseX.set(x)
        mouseY.set(y)
      }}
      onMouseLeave={() => {
        mouseX.set(0)
        mouseY.set(0)
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d"
      }}
    >
      <div className="relative">
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(0,255,255,0.1), transparent 50%)`
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Label */}
        <AnimatePresence>
          {label && (
            <motion.label
              className={cn(
                "absolute left-3 transition-all duration-300 pointer-events-none font-mono tracking-wider",
                isFocused || hasValue
                  ? "top-0 text-xs transform -translate-y-1/2 bg-gradient-to-r from-dark-bg to-dark-bg px-2"
                  : "top-1/2 transform -translate-y-1/2 text-sm",
                error ? "text-red-400" : success ? "text-green-400" : "text-neon-cyan/70"
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {label}
            </motion.label>
          )}
        </AnimatePresence>

        {/* Input field */}
        <motion.div
          className="relative"
          whileFocus={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full px-4 py-3 rounded-lg font-mono transition-all duration-300 backdrop-blur-sm",
              "placeholder:text-opacity-50 placeholder:font-mono",
              currentVariant.base,
              isFocused && currentVariant.focus,
              error && currentVariant.error,
              success && currentVariant.success,
              icon && "pl-12",
              (showPasswordToggle && type === 'password') && "pr-12",
              className
            )}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              setHasValue(Boolean(e.target.value))
              props.onBlur?.(e)
            }}
            onChange={(e) => {
              setHasValue(Boolean(e.target.value))
              props.onChange?.(e)
            }}
            {...props}
          />

          {/* Left icon */}
          {icon && (
            <motion.div
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neon-cyan/70"
              animate={{ 
                rotate: isFocused ? 360 : 0,
                scale: isFocused ? 1.1 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              {icon}
            </motion.div>
          )}

          {/* Password toggle */}
          {showPasswordToggle && type === 'password' && (
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neon-cyan/70 hover:text-neon-cyan"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={showPassword ? 'visible' : 'hidden'}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          )}

          {/* Status icons */}
          <AnimatePresence>
            {(error || success) && (
              <motion.div
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={cn(
                  "absolute right-3 top-1/2 transform -translate-y-1/2",
                  showPasswordToggle && type === 'password' && "right-12"
                )}
              >
                {error ? (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Animated border */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={isFocused ? {
            boxShadow: [
              "0 0 0 2px transparent",
              "0 0 0 2px rgba(0,255,255,0.5)",
              "0 0 0 2px transparent"
            ]
          } : {}}
          transition={{ duration: 2, repeat: isFocused ? Infinity : 0 }}
        />
      </div>

      {/* Error/Success message */}
      <AnimatePresence>
        {(error || success) && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "mt-2 text-xs font-mono flex items-center gap-2",
              error ? "text-red-400" : "text-green-400"
            )}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
            >
              {error ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
            </motion.div>
            {error || success}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

AnimatedInput.displayName = "AnimatedInput"