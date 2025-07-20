'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedContainer } from '@/components/ui/animated-container'
import { StatsCard, ThoughtCard, AnimatedCard } from '@/components/ui/animated-card'
import { ScrollReveal, TextScramble, CyberBorder } from '@/components/ui/scroll-animations'
import { InteractiveButton, FloatingActionButton } from '@/components/ui/interactive-button'
import { CyberPageTransition, LoadingTransition } from '@/components/ui/page-transition'
import { AnimatedInput } from '@/components/ui/animated-input'
import { 
  HoverLift, 
  Magnetic, 
  GlitchText, 
  Pulse, 
  Ripple, 
  Shimmer, 
  Floating 
} from '@/components/ui/micro-interactions'
import { 
  Brain, 
  Sparkles, 
  Zap, 
  Star, 
  Heart, 
  Rocket,
  Eye,
  Settings,
  Play,
  Pause
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AnimationShowcase() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentDemo, setCurrentDemo] = useState('all')
  const [inputValue, setInputValue] = useState('')
  const [showLoading, setShowLoading] = useState(false)

  const toggleAnimations = () => {
    setIsPlaying(!isPlaying)
    // Here you would typically disable/enable animations globally
  }

  const demoSections = [
    { id: 'all', label: 'All Demos', icon: Eye },
    { id: 'cards', label: 'Cards', icon: Brain },
    { id: 'buttons', label: 'Buttons', icon: Zap },
    { id: 'inputs', label: 'Inputs', icon: Settings },
    { id: 'micro', label: 'Micro-interactions', icon: Sparkles }
  ]

  const statsData = [
    { title: 'NEURAL_NODES', value: '1,337', icon: Brain },
    { title: 'CONNECTIONS', value: '42,069', icon: Zap },
    { title: 'THOUGHTS', value: '256', icon: Sparkles },
    { title: 'PROJECTS', value: '13', icon: Rocket }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-midnight-purple via-dark-bg to-deep-purple">
      <CyberPageTransition>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <AnimatedContainer className="mb-12">
            <div className="text-center space-y-6">
              <TextScramble 
                text="ANIMATION_SHOWCASE.EXE"
                className="text-4xl font-bold text-neon-cyan font-mono"
                trigger={isPlaying}
              />
              <p className="text-neon-green/70 font-mono text-lg">
                DEMONSTRATING NEURAL INTERFACE MOTION SYSTEMS
              </p>
              
              {/* Controls */}
              <div className="flex justify-center gap-4">
                <InteractiveButton
                  variant="cyber"
                  onClick={toggleAnimations}
                  className="font-mono"
                >
                  {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isPlaying ? 'PAUSE' : 'PLAY'}_ANIMATIONS
                </InteractiveButton>
                
                <InteractiveButton
                  variant="neon"
                  onClick={() => setShowLoading(true)}
                  className="font-mono"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  TEST_LOADING
                </InteractiveButton>
              </div>
            </div>
          </AnimatedContainer>

          {/* Demo Navigation */}
          <ScrollReveal className="mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {demoSections.map((section, index) => {
                const Icon = section.icon
                return (
                  <Ripple key={section.id}>
                    <InteractiveButton
                      variant={currentDemo === section.id ? "cyber" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentDemo(section.id)}
                      delay={index * 0.1}
                      className="font-mono text-xs"
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {section.label}
                    </InteractiveButton>
                  </Ripple>
                )
              })}
            </div>
          </ScrollReveal>

          {/* Stats Cards Demo */}
          {(currentDemo === 'all' || currentDemo === 'cards') && (
            <ScrollReveal className="mb-12">
              <CyberBorder className="p-6 mb-6">
                <h3 className="text-xl font-bold text-neon-cyan font-mono mb-4">
                  ANIMATED_STATS_CARDS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {statsData.map((stat, index) => (
                    <StatsCard
                      key={stat.title}
                      title={stat.title}
                      value={stat.value}
                      icon={stat.icon}
                      delay={index * 0.1}
                    />
                  ))}
                </div>
              </CyberBorder>
            </ScrollReveal>
          )}

          {/* Button Demos */}
          {(currentDemo === 'all' || currentDemo === 'buttons') && (
            <ScrollReveal className="mb-12">
              <CyberBorder className="p-6 mb-6">
                <h3 className="text-xl font-bold text-neon-cyan font-mono mb-4">
                  INTERACTIVE_BUTTONS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-mono text-neon-green">CYBER_VARIANT</h4>
                    <InteractiveButton variant="cyber" size="sm">Small Button</InteractiveButton>
                    <InteractiveButton variant="cyber" size="md">Medium Button</InteractiveButton>
                    <InteractiveButton variant="cyber" size="lg">Large Button</InteractiveButton>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-mono text-neon-green">NEON_VARIANT</h4>
                    <InteractiveButton variant="neon" size="sm">Small Neon</InteractiveButton>
                    <InteractiveButton variant="neon" size="md">Medium Neon</InteractiveButton>
                    <InteractiveButton variant="neon" size="lg">Large Neon</InteractiveButton>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-mono text-neon-green">SPECIAL_STATES</h4>
                    <InteractiveButton variant="pulse" size="md">Pulse Button</InteractiveButton>
                    <InteractiveButton variant="cyber" size="md" loading>Loading...</InteractiveButton>
                    <InteractiveButton variant="neon" size="md" disabled>Disabled</InteractiveButton>
                  </div>
                </div>
              </CyberBorder>
            </ScrollReveal>
          )}

          {/* Input Demos */}
          {(currentDemo === 'all' || currentDemo === 'inputs') && (
            <ScrollReveal className="mb-12">
              <CyberBorder className="p-6 mb-6">
                <h3 className="text-xl font-bold text-neon-cyan font-mono mb-4">
                  ANIMATED_INPUT_FIELDS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <AnimatedInput
                      label="Neural Username"
                      placeholder="Enter your neural ID..."
                      icon={<Brain className="h-4 w-4" />}
                      variant="cyber"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                    
                    <AnimatedInput
                      label="Security Protocol"
                      type="password"
                      placeholder="Enter access code..."
                      icon={<Zap className="h-4 w-4" />}
                      variant="neon"
                      showPasswordToggle
                    />
                    
                    <AnimatedInput
                      label="Error State Demo"
                      placeholder="This will show error..."
                      variant="cyber"
                      error="Neural connection failed"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <AnimatedInput
                      label="Success State Demo"
                      placeholder="This will show success..."
                      variant="ghost"
                      success="Neural link established"
                    />
                    
                    <AnimatedInput
                      label="Ghost Variant"
                      placeholder="Minimal design..."
                      variant="ghost"
                      icon={<Star className="h-4 w-4" />}
                    />
                  </div>
                </div>
              </CyberBorder>
            </ScrollReveal>
          )}

          {/* Micro-interactions Demo */}
          {(currentDemo === 'all' || currentDemo === 'micro') && (
            <ScrollReveal className="mb-12">
              <CyberBorder className="p-6 mb-6">
                <h3 className="text-xl font-bold text-neon-cyan font-mono mb-4">
                  MICRO_INTERACTIONS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-mono text-neon-green">HOVER_EFFECTS</h4>
                    
                    <HoverLift className="p-4 bg-cyber-purple/20 rounded-lg border border-cyber-purple/30">
                      <div className="text-center">
                        <Brain className="h-8 w-8 mx-auto mb-2 text-neon-cyan" />
                        <p className="text-sm font-mono text-neon-cyan">Hover Lift Effect</p>
                      </div>
                    </HoverLift>
                    
                    <Magnetic className="p-4 bg-neon-pink/20 rounded-lg border border-neon-pink/30">
                      <div className="text-center">
                        <Heart className="h-8 w-8 mx-auto mb-2 text-neon-pink" />
                        <p className="text-sm font-mono text-neon-pink">Magnetic Effect</p>
                      </div>
                    </Magnetic>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-mono text-neon-green">TEXT_EFFECTS</h4>
                    
                    <div className="p-4 bg-neon-green/20 rounded-lg border border-neon-green/30">
                      <GlitchText 
                        intensity="high"
                        trigger={isPlaying}
                        className="text-neon-green font-mono"
                      >
                        GLITCH_TEXT_DEMO
                      </GlitchText>
                    </div>
                    
                    <Shimmer color="cyan" className="p-4 bg-neon-cyan/20 rounded-lg border border-neon-cyan/30">
                      <p className="text-sm font-mono text-neon-cyan text-center">
                        Shimmer Effect
                      </p>
                    </Shimmer>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-mono text-neon-green">SPECIAL_EFFECTS</h4>
                    
                    <Pulse intensity="normal" color="purple" className="p-4 bg-cyber-purple/20 rounded-lg border border-cyber-purple/30">
                      <div className="text-center">
                        <Sparkles className="h-8 w-8 mx-auto mb-2 text-cyber-purple" />
                        <p className="text-sm font-mono text-cyber-purple">Neural Pulse</p>
                      </div>
                    </Pulse>
                    
                    <Floating className="p-4 bg-neon-cyan/20 rounded-lg border border-neon-cyan/30">
                      <div className="text-center">
                        <Rocket className="h-8 w-8 mx-auto mb-2 text-neon-cyan" />
                        <p className="text-sm font-mono text-neon-cyan">Floating Element</p>
                      </div>
                    </Floating>
                  </div>
                </div>
              </CyberBorder>
            </ScrollReveal>
          )}

          {/* Card Animations Demo */}
          {(currentDemo === 'all' || currentDemo === 'cards') && (
            <ScrollReveal className="mb-12">
              <CyberBorder className="p-6">
                <h3 className="text-xl font-bold text-neon-cyan font-mono mb-4">
                  ANIMATED_CARD_VARIANTS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ThoughtCard>
                    <CardHeader>
                      <CardTitle className="text-neon-cyan font-mono">
                        THOUGHT_CARD_DEMO
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-neon-green/70 font-mono text-sm">
                        This card includes glitch effects and advanced hover animations
                        for displaying neural thought patterns.
                      </p>
                    </CardContent>
                  </ThoughtCard>
                  
                  <AnimatedCard glitch={true} glow={true}>
                    <CardHeader>
                      <CardTitle className="text-neon-pink font-mono">
                        CUSTOM_ANIMATED_CARD
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-neon-pink/70 font-mono text-sm">
                        Advanced card with custom animations, glitch effects,
                        and cyber-themed interactions.
                      </p>
                    </CardContent>
                  </AnimatedCard>
                </div>
              </CyberBorder>
            </ScrollReveal>
          )}

          {/* Performance Info */}
          <ScrollReveal>
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-neon-cyan font-mono">
                  PERFORMANCE_METRICS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono">
                  <div>
                    <p className="text-neon-green">• Hardware acceleration optimized</p>
                    <p className="text-neon-green">• 60fps smooth animations</p>
                    <p className="text-neon-green">• Reduced motion support</p>
                  </div>
                  <div>
                    <p className="text-neon-cyan">• Framer Motion powered</p>
                    <p className="text-neon-cyan">• CSS-in-JS animations</p>
                    <p className="text-neon-cyan">• Intersection Observer</p>
                  </div>
                  <div>
                    <p className="text-neon-pink">• Mobile optimized</p>
                    <p className="text-neon-pink">• Touch-friendly</p>
                    <p className="text-neon-pink">• Accessibility compliant</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </CyberPageTransition>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <Star className="h-6 w-6" />
      </FloatingActionButton>

      {/* Loading Demo */}
      <AnimatePresence>
        {showLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            onClick={() => setShowLoading(false)}
          >
            <LoadingTransition />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}