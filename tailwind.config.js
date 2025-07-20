/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../shared/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk color palette matching main site
        'midnight-purple': '#1a0b2e',
        'deep-purple': '#16213e',
        'cyber-purple': '#7209b7',
        'neon-cyan': '#00ffff',
        'neon-pink': '#ff00ff',
        'neon-green': '#39ff14',
        'matrix-green': '#00ff41',
        'dark-bg': '#0a0a0a',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      animation: {
        'cyber-gradient': 'cyber-gradient 3s ease-in-out infinite',
        'cyber-float': 'cyber-float 3s ease-in-out infinite',
        'matrix-fall': 'matrix-fall linear infinite',
        'glitch-1': 'glitch-1 2s infinite',
        'glitch-2': 'glitch-2 2s infinite',
        'scan': 'scan 0.1s linear infinite',
        'blink': 'blink 1s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        'cyber-gradient': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'cyber-float': {
          '0%, 100%': { transform: 'translateY(0px) rotateY(0deg)' },
          '50%': { transform: 'translateY(-10px) rotateY(180deg)' },
        },
        'matrix-fall': {
          'to': { transform: 'translateY(100vh)' },
        },
        'glitch-1': {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        'glitch-2': {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(2px, 2px)' },
          '40%': { transform: 'translate(2px, -2px)' },
          '60%': { transform: 'translate(-2px, 2px)' },
          '80%': { transform: 'translate(-2px, -2px)' },
        },
        'scan': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(4px)' },
        },
        'blink': {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}