/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        term: {
          bg: '#0a0a0a',
          surface: '#0d0d0d',
          panel: '#0f0f0f',
          border: '#1a1a1a',
          'border-hi': '#2a2a2a',
          green: '#00ff41',
          'green-dim': '#004d13',
          cyan: '#00cfff',
          yellow: '#ffd700',
          red: '#ff3040',
          orange: '#ff6b35',
          primary: '#c8c8c8',
          secondary: '#666666',
          dim: '#333333',
          muted: '#222222',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', '"Fira Mono"', 'Menlo', 'monospace'],
      },
      animation: {
        'blink': 'blink 1s step-end infinite',
        'fade-in': 'fadeIn 0.1s ease-out',
        'slide-in': 'slideIn 0.12s ease-out',
        'pulse-green': 'pulseGreen 1.2s ease-in-out infinite',
        'scan': 'scan 6s linear infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseGreen: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
}
