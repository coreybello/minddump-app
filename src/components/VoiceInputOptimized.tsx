'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { debounce, performanceMonitor } from '@/lib/performance'

interface VoiceInputOptimizedProps {
  onTranscript: (text: string) => void
  onError?: (error: string) => void
  isDisabled?: boolean
  className?: string
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
        confidence: number
      }
      isFinal: boolean
    }
  }
  resultIndex: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onaudiostart: ((event: Event) => void) | null
  onaudioend: ((event: Event) => void) | null
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  onerror: ((event: Event) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognition
    }
    webkitSpeechRecognition?: {
      new (): SpeechRecognition
    }
  }
}

export default function VoiceInputOptimized({
  onTranscript,
  onError,
  isDisabled = false,
  className = ''
}: VoiceInputOptimizedProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [transcript, setTranscript] = useState('')
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const finalTranscriptRef = useRef('')
  const startTimeRef = useRef<number>(0)

  // Check if Speech Recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  // Optimized debounced transcript processing
  const debouncedTranscriptUpdate = useCallback(
    debounce((text: string) => {
      if (text.trim()) {
        performanceMonitor.record('voice_transcript_processed', text.length, {
          confidence: confidence.toString()
        })
        onTranscript(text.trim())
      }
    }, 500), // 500ms debounce for better performance
    [onTranscript, confidence]
  )

  // Initialize speech recognition with optimized settings
  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition!
    const recognition = new SpeechRecognition()

    // Optimized settings for real-time processing
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1 // Reduce processing overhead

    recognition.onstart = () => {
      startTimeRef.current = performance.now()
      setIsListening(true)
      setIsProcessing(false)
      performanceMonitor.record('voice_recognition_started', 1)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''
      let finalTranscript = ''

      // Process results efficiently
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcriptText = result[0].transcript
        const confidenceScore = result[0].confidence || 0

        if (result.isFinal) {
          finalTranscript += transcriptText
          finalTranscriptRef.current += transcriptText + ' '
          
          // Update confidence based on final results
          setConfidence(confidenceScore)
          
          // Process final transcript immediately
          debouncedTranscriptUpdate(finalTranscriptRef.current)
        } else {
          interimTranscript += transcriptText
        }
      }

      // Update UI with interim results for better UX
      setTranscript(finalTranscriptRef.current + interimTranscript)
    }

    recognition.onerror = (event: any) => {
      const duration = performance.now() - startTimeRef.current
      performanceMonitor.record('voice_recognition_error', duration, {
        error: event.error || 'unknown'
      })
      
      setIsListening(false)
      setIsProcessing(false)
      
      const errorMessage = `Speech recognition error: ${event.error || 'Unknown error'}`
      console.error(errorMessage)
      onError?.(errorMessage)
    }

    recognition.onend = () => {
      const duration = performance.now() - startTimeRef.current
      performanceMonitor.record('voice_recognition_duration', duration)
      
      setIsListening(false)
      setIsProcessing(false)
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }

    recognition.onaudiostart = () => {
      setIsProcessing(true)
    }

    recognition.onaudioend = () => {
      setIsProcessing(false)
    }

    return recognition
  }, [isSupported, onError, debouncedTranscriptUpdate])

  // Start listening with error handling
  const startListening = useCallback(async () => {
    if (!isSupported || isDisabled || isListening) return

    try {
      // Request microphone permission if needed
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true })
      }

      const recognition = initializeRecognition()
      if (!recognition) return

      recognitionRef.current = recognition
      finalTranscriptRef.current = ''
      setTranscript('')
      setConfidence(0)

      // Set a timeout to auto-stop after 60 seconds for performance
      timeoutRef.current = setTimeout(() => {
        stopListening()
      }, 60000)

      recognition.start()
    } catch (error) {
      const errorMessage = `Failed to start voice recognition: ${error}`
      console.error(errorMessage)
      onError?.(errorMessage)
      performanceMonitor.record('voice_recognition_start_error', 1)
    }
  }, [isSupported, isDisabled, isListening, initializeRecognition, onError])

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }

    // Process any remaining transcript
    if (finalTranscriptRef.current.trim()) {
      debouncedTranscriptUpdate(finalTranscriptRef.current)
    }

    setIsListening(false)
    setIsProcessing(false)
  }, [debouncedTranscriptUpdate])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  // Don't render if not supported
  if (!isSupported) {
    return null
  }

  return (
    <div className={`voice-input-optimized ${className}`}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={isListening ? stopListening : startListening}
          disabled={isDisabled}
          className={`relative overflow-hidden transition-all duration-200 ${
            isListening 
              ? 'bg-red-900/50 border-red-500 text-red-300' 
              : 'bg-midnight-purple/50 border-neon-purple text-neon-purple'
          }`}
        >
          {/* Animated background for active state */}
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

          <div className="relative z-10 flex items-center gap-2">
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            
            <span className="font-mono text-xs">
              {isListening ? 'STOP' : 'VOICE'}
            </span>
          </div>
        </Button>
      </motion.div>

      {/* Real-time transcript display */}
      <AnimatePresence>
        {isListening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 p-2 bg-midnight-purple/30 rounded border border-neon-cyan/30"
          >
            <div className="text-xs text-neon-cyan/70 font-mono mb-1">
              Listening... {confidence > 0 && `(${Math.round(confidence * 100)}% confidence)`}
            </div>
            <div className="text-sm text-neon-cyan font-mono">
              {transcript}
              <motion.span
                className="inline-block w-2 h-4 bg-neon-cyan ml-1"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance indicator */}
      {isListening && (
        <motion.div
          className="mt-1 h-1 bg-gray-700 rounded overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </motion.div>
      )}
    </div>
  )
}