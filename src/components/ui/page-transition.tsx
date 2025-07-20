'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="page"
        className={className}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.5,
          ease: [0.25, 0.25, 0, 1]
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export function CyberPageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="cyber-page"
        className={className}
        initial={{ 
          opacity: 0, 
          scale: 0.95,
          filter: 'blur(10px)',
          rotateX: -15
        }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          filter: 'blur(0px)',
          rotateX: 0
        }}
        exit={{ 
          opacity: 0, 
          scale: 1.05,
          filter: 'blur(10px)',
          rotateX: 15
        }}
        transition={{
          duration: 0.7,
          ease: [0.25, 0.25, 0, 1]
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

export function LoadingTransition() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.25, 0, 1] }}
      >
        {/* Cyber loading spinner */}
        <motion.div
          className="w-16 h-16 border-2 border-neon-cyan/30 rounded-full border-t-neon-cyan"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Pulsing center dot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: [0.25, 0.25, 0, 1]
          }}
        >
          <div className="w-2 h-2 bg-neon-cyan rounded-full shadow-[0_0_10px_var(--neon-cyan)]" />
        </motion.div>

        {/* Loading text */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-neon-cyan font-mono text-sm tracking-wider">
            INITIALIZING NEURAL MATRIX...
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}