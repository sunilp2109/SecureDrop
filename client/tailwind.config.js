/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05070A',
          900: '#0A0E13',
          800: '#10161D',
          700: '#161D26',
          600: '#1C2530',
          500: '#2A3442',
        },
        mist: {
          50: '#F4F7FA',
          100: '#E7EDF4',
          300: '#B7C2D0',
          400: '#8B97A8',
          500: '#6B7687',
        },
        accent: {
          DEFAULT: '#34D399',
          dim: '#10B981',
          muted: '#065F46',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display': ['3.25rem', { lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '600' }],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04), 0 24px 48px -28px rgba(0,0,0,0.8)',
        lift: '0 10px 30px -18px rgba(16,185,129,0.45)',
        toast: '0 16px 40px -20px rgba(0,0,0,0.7)',
      },
      borderRadius: {
        '2xl': '1.1rem',
        '3xl': '1.5rem',
      },
      transitionDuration: {
        180: '180ms',
        220: '220ms',
        280: '280ms',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        'check-pop': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '70%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 280ms ease-out both',
        'scale-in': 'scale-in 220ms ease-out both',
        shake: 'shake 280ms ease-in-out',
        'check-pop': 'check-pop 320ms ease-out both',
      },
      backgroundImage: {
        grid: 'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
        glow: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(52,211,153,0.12), transparent 60%)',
      },
    },
  },
  plugins: [],
};
