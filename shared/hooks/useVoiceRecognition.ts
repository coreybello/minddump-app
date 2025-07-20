import { useState, useRef, useCallback, useEffect } from 'react'
import type { VoiceRecognitionState } from '../types/minddump'

interface UseVoiceRecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
}

export function useVoiceRecognition({
  continuous = true,
  interimResults = true,
  language = 'en-US',
  onResult,
  onError,
  onStart,
  onEnd
}: UseVoiceRecognitionOptions = {}) {
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isSupported: false,
    transcript: ''
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check for browser support
  useEffect(() => {
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    setState(prev => ({ ...prev, isSupported }))
  }, [])

  const startListening = useCallback(() => {
    if (!state.isSupported) {
      const error = 'Speech recognition is not supported in this browser'
      setState(prev => ({ ...prev, error }))
      onError?.(error)
      return
    }

    try {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition

      const recognition = new SpeechRecognition()
      
      recognition.continuous = continuous
      recognition.interimResults = interimResults
      recognition.lang = language

      recognition.onstart = () => {
        setState(prev => ({ 
          ...prev, 
          isListening: true, 
          error: undefined 
        }))
        onStart?.()
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        const fullTranscript = finalTranscript || interimTranscript
        setState(prev => ({ 
          ...prev, 
          transcript: prev.transcript + ' ' + fullTranscript 
        }))

        if (finalTranscript) {
          onResult?.(finalTranscript)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const error = `Speech recognition error: ${event.error}`
        setState(prev => ({ 
          ...prev, 
          isListening: false, 
          error 
        }))
        onError?.(error)
      }

      recognition.onend = () => {
        setState(prev => ({ 
          ...prev, 
          isListening: false 
        }))
        onEnd?.()
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (error) {
      const errorMessage = `Failed to start speech recognition: ${error}`
      setState(prev => ({ ...prev, error: errorMessage }))
      onError?.(errorMessage)
    }
  }, [state.isSupported, continuous, interimResults, language, onResult, onError, onStart, onEnd])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '' }))
  }, [])

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [state.isListening, startListening, stopListening])

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
    toggleListening
  }
}

export default useVoiceRecognition