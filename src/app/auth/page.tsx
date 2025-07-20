'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
// UI components handled inline with custom styling
import { Brain, Mail, Lock, Github, Chrome, Zap } from 'lucide-react'

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`
          }
        })
        if (error) throw error
        alert('Check your email for verification link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error: any) {
      alert(error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Cyberpunk Background Effects */}
      <div className="glitch-overlay"></div>
      <div className="cyber-grid"></div>
      <div className="scan-lines"></div>
      <div className="cyber-particles"></div>

      {/* Background Styling */}
      <style jsx>{`
        .glitch-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 50%, #0f0f23 100%);
          opacity: 0.95;
          z-index: -3;
        }

        .cyber-grid {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px),
            linear-gradient(rgba(147, 112, 219, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(147, 112, 219, 0.02) 1px, transparent 1px);
          background-size: 50px 50px, 50px 50px, 10px 10px, 10px 10px;
          animation: gridMove 20s linear infinite;
          z-index: -2;
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        .scan-lines {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            transparent 0%,
            rgba(0, 255, 136, 0.01) 1%,
            transparent 2%,
            transparent 100%
          );
          background-size: 100% 3px;
          animation: scanlineMove 0.1s linear infinite;
          pointer-events: none;
          z-index: -1;
        }

        @keyframes scanlineMove {
          0% { background-position: 0 0; }
          100% { background-position: 0 3px; }
        }

        .cyber-particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -1;
        }

        .cyber-particle {
          position: absolute;
          background: linear-gradient(45deg, #00ff88, #9370db);
          border-radius: 2px;
          opacity: 0.6;
          animation: cyberFloat 15s infinite linear;
        }

        @keyframes cyberFloat {
          0% { 
            transform: translateY(100vh) translateX(0) rotate(0deg); 
            opacity: 0; 
          }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { 
            transform: translateY(-100px) translateX(50px) rotate(180deg); 
            opacity: 0; 
          }
        }

        .auth-container {
          background: rgba(0, 20, 40, 0.9);
          border: 2px solid #00ff88;
          border-radius: 0;
          position: relative;
          backdrop-filter: blur(10px);
          clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
        }

        .auth-container::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #00ff88, #9370db, #00ff88);
          z-index: -1;
          animation: borderGlow 2s infinite;
        }

        @keyframes borderGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .cyber-input {
          background: rgba(0, 10, 20, 0.95);
          border: 2px solid #9370db;
          color: #00ff88;
          font-family: 'JetBrains Mono', monospace;
          transition: all 0.3s ease;
        }

        .cyber-input:focus {
          border-color: #00ff88;
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
          background: rgba(0, 10, 20, 1);
        }

        .cyber-button {
          background: linear-gradient(45deg, #9370db, #00ff88);
          border: 2px solid #00ff88;
          color: #000;
          font-weight: bold;
          font-family: 'JetBrains Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
        }

        .cyber-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 255, 136, 0.4);
        }

        .cyber-button-secondary {
          background: rgba(0, 20, 40, 0.9);
          border: 2px solid #9370db;
          color: #00ff88;
          clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
        }

        .cyber-button-secondary:hover {
          background: rgba(0, 255, 136, 0.1);
          border-color: #00ff88;
          transform: scale(1.05);
        }

        .logo-glow {
          text-shadow: 0 0 10px #00ff88;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.1); filter: brightness(1.2); }
        }
      `}</style>

      <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center relative z-10">
        <div className="auth-container w-full max-w-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Brain className="h-12 w-12 text-neon-cyan" />
                <div className="absolute -inset-1 bg-neon-cyan/20 rounded-full blur animate-cyber-float"></div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-neon-cyan font-mono logo-glow mb-2">
              MIND_DUMP
            </h1>
            <p className="text-neon-green/80 text-sm font-mono">
              NEURAL INTERFACE ACCESS REQUIRED
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-4 mb-6">
            <button
              onClick={() => handleOAuthSignIn('github')}
              disabled={isLoading}
              className="w-full cyber-button-secondary p-3 flex items-center justify-center gap-3 transition-all"
            >
              <Github className="h-5 w-5" />
              <span className="font-mono text-sm">AUTHENTICATE VIA GITHUB</span>
            </button>
            
            <button
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
              className="w-full cyber-button-secondary p-3 flex items-center justify-center gap-3 transition-all"
            >
              <Chrome className="h-5 w-5" />
              <span className="font-mono text-sm">AUTHENTICATE VIA GOOGLE</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neon-purple/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-dark-bg px-4 text-neon-green/60 font-mono">
                OR DIRECT NEURAL LINK
              </span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neon-green mb-2 font-mono">
                EMAIL_ADDRESS
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-neon-purple" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cyber-input w-full pl-10 pr-4 py-3 text-sm"
                  placeholder="neural.interface@mindnet.io"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neon-green mb-2 font-mono">
                ACCESS_CODE
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-neon-purple" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cyber-input w-full pl-10 pr-4 py-3 text-sm"
                  placeholder="••••••••••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full cyber-button p-3 flex items-center justify-center gap-2"
            >
              <Zap className="h-4 w-4" />
              <span className="font-mono text-sm">
                {isLoading ? 'CONNECTING...' : isSignUp ? 'CREATE_ACCOUNT' : 'AUTHENTICATE'}
              </span>
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-neon-cyan hover:text-neon-green transition-colors font-mono text-sm"
            >
              {isSignUp ? '> EXISTING_USER_LOGIN' : '> CREATE_NEW_ACCOUNT'}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Particles Script */}
      <script dangerouslySetInnerHTML={{
        __html: `
          function createCyberParticles() {
            const container = document.querySelector('.cyber-particles');
            if (!container) return;
            
            const particleCount = 15;
            
            for (let i = 0; i < particleCount; i++) {
              const particle = document.createElement('div');
              particle.className = 'cyber-particle';
              particle.style.left = Math.random() * 100 + '%';
              particle.style.width = Math.random() * 3 + 1 + 'px';
              particle.style.height = Math.random() * 20 + 5 + 'px';
              particle.style.animationDelay = Math.random() * 15 + 's';
              particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
              container.appendChild(particle);
            }
          }
          
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createCyberParticles);
          } else {
            createCyberParticles();
          }
        `
      }} />
    </div>
  )
}