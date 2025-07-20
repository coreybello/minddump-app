'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Mic, MicOff, Send, ChevronDown, Sparkles, Brain } from 'lucide-react'

interface MindDumpInputProps {
  onSubmit: (text: string, category?: string) => Promise<void>
  isProcessing?: boolean
}

export default function MindDumpInput({ onSubmit, isProcessing = false }: MindDumpInputProps) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState<string>()
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any | null>(null)

  const categories = [
    { label: 'Auto-detect', value: undefined, icon: '🤖', color: 'neon-cyan' },
    { label: 'Goal', value: 'goal', icon: '🎯', color: 'neon-purple' },
    { label: 'Habit', value: 'habit', icon: '🔁', color: 'neon-green' },
    { label: 'Project Idea', value: 'projectidea', icon: '💡', color: 'neon-yellow' },
    { label: 'Task', value: 'task', icon: '✅', color: 'neon-blue' },
    { label: 'Reminder', value: 'reminder', icon: '⏰', color: 'neon-orange' },
    { label: 'Note', value: 'note', icon: '📝', color: 'neon-pink' },
    { label: 'Insight', value: 'insight', icon: '🧠', color: 'neon-cyan' },
    { label: 'Learning', value: 'learning', icon: '📚', color: 'neon-purple' },
    { label: 'Career', value: 'career', icon: '💼', color: 'neon-green' },
    { label: 'Metric', value: 'metric', icon: '📊', color: 'neon-yellow' },
    { label: 'Idea', value: 'idea', icon: '💭', color: 'neon-blue' },
    { label: 'System', value: 'system', icon: '⚙️', color: 'neon-orange' },
    { label: 'Automation', value: 'automation', icon: '🤖', color: 'neon-pink' },
    { label: 'Person', value: 'person', icon: '👤', color: 'neon-cyan' },
    { label: 'Sensitive', value: 'sensitive', icon: '🔒', color: 'red-400' },
  ]

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          setText(prev => prev + ' ' + finalTranscript)
        }
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const handleSubmit = async () => {
    if (!text.trim()) return
    
    try {
      await onSubmit(text.trim(), category)
      setText('')
      setCategory(undefined)
    } catch (error) {
      console.error('Error submitting thought:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="cyber-card relative overflow-hidden">
        {/* Animated background pulse */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 via-cyber-purple/5 to-neon-pink/5"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{ backgroundSize: '200% 200%' }}
        />
        
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-3 text-neon-cyan font-mono">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <Brain className="h-6 w-6" />
            </motion.div>
            NEURAL_INPUT_INTERFACE
          </CardTitle>
          <CardDescription className="text-neon-green/70 font-mono text-sm">
            STREAM_YOUR_CONSCIOUSNESS → AI_PROCESSING → ORGANIZED_OUTPUT
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          <div className="space-y-3">
            <div className="relative">
              <Textarea
                placeholder="Initialize thought stream... What patterns are emerging in your neural matrix?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="cyber-input min-h-[140px] resize-none pr-12 font-mono text-neon-cyan placeholder:text-neon-cyan/50"
                disabled={isProcessing}
              />
              
              {/* Animated typing indicator */}
              <AnimatePresence>
                {text && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-3 right-3"
                  >
                    <Sparkles className="h-4 w-4 text-neon-purple animate-pulse" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Character count with animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: text.length > 10 ? 1 : 0 }}
                className="absolute bottom-3 right-3 text-xs text-neon-green/60 font-mono"
              >
                {text.length} chars
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: text ? 1 : 0.6 }}
              className="text-sm text-neon-green/70 font-mono flex items-center gap-2"
            >
              <span className="animate-pulse">▶</span>
              CTRL+ENTER to process | Voice input available
            </motion.div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="cyber-button bg-midnight-purple/50 border-cyber-purple text-neon-cyan">
                    {category ? (
                      <div className="flex items-center gap-2">
                        <span>{categories.find(c => c.value === category)?.icon}</span>
                        <span>{categories.find(c => c.value === category)?.label}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>🤖</span>
                        <span>AUTO_DETECT</span>
                      </div>
                    )}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-midnight-purple/95 border-cyber-purple backdrop-blur-md max-h-80 overflow-y-auto">
                  {categories.map((cat) => (
                    <DropdownMenuItem
                      key={cat.label}
                      onClick={() => setCategory(cat.value)}
                      className={`text-neon-cyan hover:bg-cyber-purple/30 font-mono transition-colors duration-200 ${
                        category === cat.value ? 'bg-cyber-purple/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="flex-1">{cat.label?.toUpperCase()}</span>
                        {category === cat.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 rounded-full bg-neon-cyan"
                          />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <AnimatePresence>
                {category && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -10 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Badge className="bg-cyber-purple/30 text-neon-purple border-cyber-purple font-mono">
                      <div className="flex items-center gap-2">
                        <span>{categories.find(c => c.value === category)?.icon}</span>
                        <span>{categories.find(c => c.value === category)?.label?.toUpperCase()}</span>
                      </div>
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  className={`cyber-button relative overflow-hidden ${
                    isListening 
                      ? 'bg-red-900/50 border-red-500 text-red-300 animate-pulse' 
                      : 'bg-midnight-purple/50 border-neon-purple text-neon-purple'
                  }`}
                >
                  {isListening && (
                    <motion.div
                      className="absolute inset-0 bg-red-500/20"
                      animate={{
                        opacity: [0.3, 0.7, 0.3],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  )}
                  <div className="relative z-10 flex items-center">
                    {isListening ? (
                      <>
                        <MicOff className="h-4 w-4 mr-1" />
                        STOP
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-1" />
                        VOICE
                      </>
                    )}
                  </div>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleSubmit}
                  disabled={!text.trim() || isProcessing}
                  size="sm"
                  className="cyber-button bg-gradient-to-r from-cyber-purple to-neon-cyan text-dark-bg font-bold relative overflow-hidden"
                >
                  {isProcessing && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-neon-cyan to-cyber-purple"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  )}
                  <div className="relative z-10 flex items-center">
                    {isProcessing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="mr-2"
                        >
                          <Brain className="h-4 w-4" />
                        </motion.div>
                        PROCESSING...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        TRANSMIT
                      </>
                    )}
                  </div>
                </Button>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}