'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, X, ExternalLink, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface SuccessNotificationProps {
  show: boolean
  onClose: () => void
  message: string
  project?: {
    title: string
    githubUrl?: string
  }
  duration?: number
}

export default function SuccessNotification({ 
  show, 
  onClose, 
  message, 
  project, 
  duration = 5000 
}: SuccessNotificationProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30,
            duration: 0.5
          }}
          className="fixed bottom-4 right-4 z-50 max-w-md"
        >
          <Card className="cyber-card bg-midnight-purple/95 border-neon-green shadow-lg backdrop-blur-md">
            {/* Animated background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-neon-green/10 via-neon-cyan/10 to-neon-green/10"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              style={{ backgroundSize: '200% 200%' }}
            />
            
            <CardContent className="p-4 relative z-10">
              <div className="flex items-start space-x-3">
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                  className="relative"
                >
                  <CheckCircle className="h-6 w-6 text-neon-green" />
                  <motion.div
                    className="absolute -inset-1 bg-neon-green/30 rounded-full blur-sm"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <motion.p 
                    className="text-sm font-medium text-neon-green font-mono"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    PROCESS_COMPLETE
                  </motion.p>
                  
                  <motion.p 
                    className="text-sm text-neon-cyan/80 font-mono mt-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {message}
                  </motion.p>

                  {/* Project Info */}
                  {project && (
                    <motion.div 
                      className="mt-3 p-2 bg-cyber-purple/20 border border-cyber-purple/30 rounded"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <GitBranch className="h-4 w-4 text-neon-purple" />
                          <span className="text-xs text-neon-purple font-mono">
                            PROJECT: {project.title}
                          </span>
                        </div>
                        
                        {project.githubUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(project.githubUrl, '_blank')}
                            className="h-6 px-2 cyber-button bg-cyber-purple/30 border-cyber-purple text-neon-purple text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            REPO
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Progress Bar */}
                  {duration > 0 && (
                    <motion.div 
                      className="mt-3 h-1 bg-midnight-purple rounded-full overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-neon-green to-neon-cyan"
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: duration / 1000, ease: 'linear' }}
                      />
                    </motion.div>
                  )}
                </div>

                {/* Close Button */}
                <motion.button
                  onClick={onClose}
                  className="text-neon-cyan/60 hover:text-neon-cyan transition-colors p-1"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}