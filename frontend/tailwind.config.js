/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'valhala': {
          'primary': '#1a1a2e',
          'secondary': '#16213e',
          'accent': '#e94560',
          'gold': '#ffd700',
          'nordic': '#0f3460',
          'dark': '#0a0a0a',
          'light': '#f5f5f5'
        }
      },
      fontFamily: {
        'norse': ['"Norse"', '"Cinema"', '"Segoe UI"', 'sans-serif'],
        'sans': ['"Inter"', '"Segoe UI"', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out'
        // REMOVED: van-driving, van-pulse animations (handled by custom CSS)
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        }
        // REMOVED: vanDriving, vanPulse keyframes
      }
    },
  },
  plugins: [],
}