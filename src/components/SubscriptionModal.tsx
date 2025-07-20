'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Copy, ExternalLink, CheckCircle } from 'lucide-react'
import { claudeSubscriptionManager } from '@/lib/claude-subscription'

interface SubscriptionModalProps {
  onAnalysisComplete: (analysis: {type: string, expandedThought: string, [key: string]: unknown}) => void
}

export default function SubscriptionModal({ onAnalysisComplete }: SubscriptionModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [analysisInput, setAnalysisInput] = useState('')
  const [rawText, setRawText] = useState('')
  const [step, setStep] = useState<'prompt' | 'input'>('prompt')

  useEffect(() => {
    const handleSubscriptionPrompt = (event: CustomEvent) => {
      setPrompt(event.detail.prompt)
      setIsOpen(true)
      setStep('prompt')
      
      const pending = claudeSubscriptionManager.getPendingAnalysis()
      if (pending) {
        setRawText(pending.rawText)
      }
    }

    window.addEventListener('claude-subscription-prompt', handleSubscriptionPrompt as EventListener)
    return () => window.removeEventListener('claude-subscription-prompt', handleSubscriptionPrompt as EventListener)
  }, [])

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt)
  }

  const openClaude = () => {
    window.open('https://claude.ai', '_blank')
  }

  const handleAnalysisSubmit = () => {
    try {
      const analysis = claudeSubscriptionManager.processSubscriptionAnalysis(analysisInput)
      onAnalysisComplete(analysis as any)
      setIsOpen(false)
      setAnalysisInput('')
      setStep('prompt')
    } catch {
      alert('Invalid JSON format. Please check your analysis and try again.')
    }
  }

  const switchToAPI = () => {
    claudeSubscriptionManager.setSubscriptionMode(false)
    setIsOpen(false)
    // Re-trigger analysis with API
    window.location.reload()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            Claude Subscription Mode
            <Badge variant="secondary">Pro/Max</Badge>
          </DialogTitle>
          <DialogDescription>
            Use your Claude subscription to analyze this thought, then paste the result back here.
          </DialogDescription>
        </DialogHeader>

        {step === 'prompt' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Your Thought:</h3>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">{rawText}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Analysis Prompt:</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyPrompt}>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={openClaude}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open Claude
                  </Button>
                </div>
              </div>
              <Textarea
                value={prompt}
                readOnly
                className="min-h-[200px] font-mono text-xs"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Copy the prompt above</li>
                <li>Open Claude in a new tab</li>
                <li>Paste the prompt and send it</li>
                <li>Copy Claude&apos;s JSON response</li>
                <li>Return here and paste it below</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep('input')} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
I&apos;ve Got the Analysis
              </Button>
              <Button variant="outline" onClick={switchToAPI}>
                Use API Instead
              </Button>
            </div>
          </div>
        )}

        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Paste Claude&apos;s JSON Response:</h3>
              <Textarea
                placeholder="Paste the JSON analysis from Claude here..."
                value={analysisInput}
                onChange={(e) => setAnalysisInput(e.target.value)}
                className="min-h-[300px] font-mono text-xs"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleAnalysisSubmit} 
                disabled={!analysisInput.trim()}
                className="flex-1"
              >
                Process Analysis
              </Button>
              <Button variant="outline" onClick={() => setStep('prompt')}>
                Back to Prompt
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}