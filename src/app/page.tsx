'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import MindDumpInput from '@/components/MindDumpInput'
import Dashboard from '@/components/Dashboard'
import SubscriptionModal from '@/components/SubscriptionModal'
import ErrorMonitor from '@/components/ErrorMonitor'
import SuccessNotification from '@/components/SuccessNotification'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, Settings } from 'lucide-react'

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [notification, setNotification] = useState<{
    show: boolean
    message: string
    project?: { title: string; githubUrl?: string }
  }>({
    show: false,
    message: ''
  })
  // Subscription mode is always enabled - no toggle needed

  const handleThoughtSubmit = useCallback(async (text: string, category?: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/thoughts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, category }),
      })

      if (!response.ok) {
        throw new Error('Failed to process thought')
      }

      const result = await response.json()
      console.log('Thought processed:', result)
      
      // Refresh the dashboard
      setRefreshKey(prev => prev + 1)
      
      // Show enhanced success notification
      if (result.project && result.githubUrl) {
        setNotification({
          show: true,
          message: `Neural pattern processed and project generated successfully!`,
          project: {
            title: result.project.title,
            githubUrl: result.githubUrl
          }
        })
      } else {
        setNotification({
          show: true,
          message: `Thought stream analyzed and categorized as ${result.thought?.type || 'unknown'} type.`
        })
      }
    } catch (error) {
      console.error('Error submitting thought:', error)
      setNotification({
        show: true,
        message: 'Neural processing error detected. Attempting to reinitialize...'
      })
    } finally {
      setIsProcessing(false)
    }
  }, [])


  // Always use subscription mode - toggle removed per Issue #21

  const handleSubscriptionAnalysis = async (analysis: {type: string, expandedThought: string, [key: string]: unknown}) => {
    // Process the analysis as if it came from the regular flow
    setIsProcessing(true)
    try {
      const response = await fetch('/api/thoughts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: analysis.expandedThought || 'Claude subscription analysis',
          category: analysis.type,
          analysis: analysis // Pass the full analysis
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process thought')
      }

      const result = await response.json()
      console.log('Subscription analysis processed:', result)
      
      // Refresh the dashboard
      setRefreshKey(prev => prev + 1)
      
      // Show enhanced success notification
      if (result.project && result.githubUrl) {
        setNotification({
          show: true,
          message: `Subscription analysis processed and project generated!`,
          project: {
            title: result.project.title,
            githubUrl: result.githubUrl
          }
        })
      } else {
        setNotification({
          show: true,
          message: `Subscription analysis integrated successfully.`
        })
      }
    } catch (error) {
      console.error('Error processing subscription analysis:', error)
      setNotification({
        show: true,
        message: 'Subscription analysis processing failed. Check data format.'
      })
    } finally {
      setIsProcessing(false)
    }
  }


  return (
    <div className="min-h-screen relative">
      {/* Enhanced Cyberpunk scan lines effect */}
      <div className="scan-lines"></div>
      
      {/* Modernized Header */}
      <motion.header 
        className="bg-midnight-purple/40 backdrop-blur-md shadow-lg border-b border-neon-cyan/30 relative z-[2] sticky top-0"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  <Brain className="h-8 w-8 text-neon-cyan" />
                </motion.div>
                <motion.div 
                  className="absolute -inset-1 bg-neon-cyan/20 rounded-full blur"
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
              </div>
              
              <motion.h1 
                className="text-xl font-bold text-neon-cyan font-mono glitch"
                data-text="MIND_DUMP"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                MIND_DUMP
              </motion.h1>
              
              {/* Status indicator */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 500 }}
                className="hidden sm:block"
              >
                <div className="flex items-center gap-1">
                  <motion.div
                    className="w-2 h-2 bg-neon-green rounded-full"
                    animate={{
                      opacity: [1, 0.5, 1],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                  <span className="text-xs text-neon-green font-mono">ONLINE</span>
                </div>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Badge className="bg-neon-green/20 text-neon-green border-neon-green font-mono text-xs px-2 py-1">
                  <motion.span
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    AI_READY
                  </motion.span>
                </Badge>
              </motion.div>
              
              {process.env.NODE_ENV === 'development' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 400 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const errorSection = document.getElementById('error-monitor')
                      errorSection?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="text-xs cyber-button bg-midnight-purple/50 border-cyber-purple text-neon-purple"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    DEBUG
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-[2]">
        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* Enhanced Mind Dump Input */}
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <MindDumpInput 
              onSubmit={handleThoughtSubmit}
              isProcessing={isProcessing}
            />
          </motion.section>

          {/* Enhanced Dashboard */}
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Dashboard key={refreshKey} />
          </motion.section>

          {/* Enhanced Error Monitor - Development Only */}
          {process.env.NODE_ENV === 'development' && (
            <motion.section 
              id="error-monitor"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="relative"
            >
              <motion.div
                className="mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
              >
                <h2 className="text-2xl font-bold text-neon-cyan font-mono flex items-center gap-3">
                  <motion.span
                    animate={{
                      opacity: [1, 0.5, 1],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className="text-red-400"
                  >
                    ●
                  </motion.span>
                  <span className="glitch" data-text="ERROR_MONITOR.LOG">
                    ERROR_MONITOR.LOG
                  </span>
                </h2>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 }}
              >
                <ErrorMonitor />
              </motion.div>
            </motion.section>
          )}
        </motion.div>
      </main>

      {/* Subscription Modal */}
      <SubscriptionModal onAnalysisComplete={handleSubscriptionAnalysis} />
      
      {/* Success Notification */}
      <SuccessNotification 
        show={notification.show}
        message={notification.message}
        project={notification.project}
        onClose={() => setNotification({ show: false, message: '' })}
      />
    </div>
  )
}