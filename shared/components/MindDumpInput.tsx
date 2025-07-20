import React, { useState, forwardRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Mic, MicOff, Send, ChevronDown, Loader2 } from 'lucide-react'
import { useVoiceRecognition } from '../hooks/useVoiceRecognition'
import { cn } from '../utils/cn'
import type { MindDumpInputProps, ThoughtType } from '../types/minddump'

const categories: Array<{ label: string; value?: ThoughtType }> = [
  { label: 'Auto-detect', value: undefined },
  { label: 'Idea', value: 'idea' },
  { label: 'Task', value: 'task' },
  { label: 'Project', value: 'project' },
  { label: 'Reflection', value: 'reflection' },
  { label: 'Vent', value: 'vent' },
]

export interface MindDumpInputRef {
  focus: () => void
  clear: () => void
  setText: (text: string) => void
}

export const MindDumpInput = forwardRef<MindDumpInputRef, MindDumpInputProps>(({
  onSubmit,
  isProcessing = false,
  placeholder = "What's on your mind? Type your thoughts, ideas, or tasks here...",
  maxLength = 2000,
  className,
  ...props
}, ref) => {
  const [text, setText] = useState('')
  const [category, setCategory] = useState<ThoughtType>()
  
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const {
    isListening,
    isSupported: voiceSupported,
    transcript,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceRecognition({
    onResult: (newTranscript) => {
      setText(prev => (prev + ' ' + newTranscript).trim())
    },
    onError: (error) => {
      console.warn('Voice recognition error:', error)
    }
  })

  // Expose methods through ref
  React.useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    clear: () => {
      setText('')
      setCategory(undefined)
      resetTranscript()
    },
    setText: (newText: string) => setText(newText)
  }))

  const handleSubmit = async () => {
    if (!text.trim() || isProcessing) return
    
    try {
      await onSubmit(text.trim(), category)
      setText('')
      setCategory(undefined)
      resetTranscript()
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

  const characterCount = text.length
  const isNearLimit = characterCount > maxLength * 0.8
  const isOverLimit = characterCount > maxLength

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)} {...props}>
      <CardHeader>
        <CardTitle>Mind Dump</CardTitle>
        <CardDescription>
          Capture your thoughts, ideas, and tasks. They&apos;ll be automatically processed and organized.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              'min-h-[120px] resize-none',
              isOverLimit && 'border-destructive focus:border-destructive'
            )}
            disabled={isProcessing}
            maxLength={maxLength}
          />
          
          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              Press Cmd/Ctrl + Enter to submit
            </div>
            <div className={cn(
              'text-muted-foreground',
              isNearLimit && 'text-yellow-600',
              isOverLimit && 'text-destructive font-medium'
            )}>
              {characterCount}/{maxLength}
            </div>
          </div>
          
          {voiceError && (
            <div className="text-sm text-destructive">
              Voice recognition error: {voiceError}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          {/* Category Selection */}
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isProcessing}>
                  {category ? categories.find(c => c.value === category)?.label : 'Auto-detect'}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {categories.map((cat) => (
                  <DropdownMenuItem
                    key={cat.label}
                    onClick={() => setCategory(cat.value)}
                  >
                    {cat.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {category && (
              <Badge variant="secondary">
                {categories.find(c => c.value === category)?.label}
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Voice Recognition Button */}
            {voiceSupported && (
              <Button
                variant="outline"
                size="sm"
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={cn(
                  'transition-colors',
                  isListening && 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                )}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-4 w-4 mr-1" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-1" />
                    Voice
                  </>
                )}
              </Button>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!text.trim() || isProcessing || isOverLimit}
              size="sm"
              className="min-w-[80px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

MindDumpInput.displayName = 'MindDumpInput'

export default MindDumpInput