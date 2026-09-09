/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── New semantic palette ─────────────────────────────
        ink: {
          DEFAULT: '#0F172A',
          soft: '#334155',
          muted: '#64748B',
        },
        paper: '#FFFFFF',
        cloud: '#F8FAFC',
        sky: {
          DEFAULT: '#2563EB',
          soft: '#3B82F6',
          deep: '#1D4ED8',
          tint: '#DBEAFE',
        },
        forest: {
          DEFAULT: '#10B981',
          soft: '#34D399',
          deep: '#059669',
          tint: '#D1FAE5',
        },
        sand: {
          DEFAULT: '#F59E0B',
          soft: '#FBBF24',
          tint: '#FEF3C7',
        },

        // ── Legacy tokens remapped for light theme ───────────
        // Old dark navy backgrounds now map to whites & light greys.
        navy: {
          DEFAULT: '#FFFFFF',
          deep: '#F8FAFC',
          soft: '#FFFFFF',
          line: '#E2E8F0',
        },
        // Old teal now maps to primary blue.
        teal: {
          DEFAULT: '#2563EB',
          soft: '#3B82F6',
          deep: '#1D4ED8',
        },
        // Old "mist" (was light text on dark) now maps to dark ink on light.
        mist: '#0F172A',
        muted: '#64748B',
        // Gold stays but slightly warmer.
        gold: {
          DEFAULT: '#F59E0B',
          soft: '#FBBF24',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tightish: '-0.015em',
      },
      boxShadow: {
        glow: '0 20px 60px -20px rgba(37, 99, 235, 0.25)',
        soft: '0 12px 40px -18px rgba(15, 23, 42, 0.18)',
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.10)',
        lift: '0 4px 12px rgba(15, 23, 42, 0.06), 0 20px 48px -16px rgba(15, 23, 42, 0.14)',
      },
      backgroundImage: {
        'radial-glow':
          'radial-gradient(1000px 500px at 50% 10%, rgba(37,99,235,0.08), transparent 60%), radial-gradient(700px 400px at 80% 90%, rgba(16,185,129,0.06), transparent 60%)',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.03)', opacity: '1' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        breathe: 'breathe 6s ease-in-out infinite',
        floaty: 'floaty 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
