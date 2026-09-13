/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        surface: {
          0: 'var(--surface-0)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
        },
        charcoal: 'var(--charcoal)',
        amber: 'var(--amber)',
        teal: 'var(--teal)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        info: 'var(--info)',
        status: {
          success: 'var(--success)',
          warning: 'var(--warning)',
          error: 'var(--error)',
        },
        border: {
          DEFAULT: 'var(--border)',
          hover: 'var(--border-hover)',
        },
        cmpdi: {
          navy: '#0B3556',
          navyPressed: '#082741',
          charcoal: '#262A2E',
          amber: '#C98A2B',
          teal: '#1D7A72',
          tealDark: '#238C83',
          green: '#2F8A4A',
          reviewAmber: '#E0A32E',
          rust: '#B23B2E',
          steel: '#4A7FAE',
          canvas: '#F6F7F5',
          border: '#DEE1E4',
          text: '#1E2429',
        }
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out forwards',
        'pulse-dot': 'pulse-dot 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'fade-in': {
          'from': { opacity: '0', transform: 'translateY(4px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        }
      }
    },
  },
  plugins: [],
}
