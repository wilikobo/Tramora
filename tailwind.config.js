/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F172A',
          deep: '#0B1220',
          soft: '#131C31',
          line: '#1E293B',
        },
        teal: {
          DEFAULT: '#14B8A6',
          soft: '#2DD4BF',
          deep: '#0D9488',
        },
        gold: {
          DEFAULT: '#F59E0B',
          soft: '#FBBF24',
        },
        mist: '#E2E8F0',
        muted: '#94A3B8',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tightish: '-0.015em',
      },
      boxShadow: {
        glow: '0 0 60px -10px rgba(20, 184, 166, 0.35)',
        soft: '0 20px 60px -30px rgba(2, 6, 23, 0.8)',
      },
      backgroundImage: {
        'radial-glow':
          'radial-gradient(1000px 500px at 50% 10%, rgba(20,184,166,0.15), transparent 60%), radial-gradient(700px 400px at 80% 90%, rgba(245,158,11,0.12), transparent 60%)',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.03)', opacity: '1' },
        },
      },
      animation: {
        breathe: 'breathe 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
