import { motion, useScroll, useTransform } from 'framer-motion'
import WorldContour from '../components/WorldContour.jsx'
import FeatureRow from '../components/FeatureRow.jsx'

export default function Landing() {
  const { scrollY } = useScroll()
  const worldY   = useTransform(scrollY, [0, 800], [0, -60])
  const glowY    = useTransform(scrollY, [0, 800], [0, -30])
  const starsY   = useTransform(scrollY, [0, 800], [0, -20])

  return (
    <main className="relative min-h-screen overflow-hidden bg-navy">
      {/* ── Backdrop layers (parallax) ───────────────────────────── */}
      <motion.div style={{ y: worldY }} className="pointer-events-none absolute inset-0 z-0">
        <WorldContour className="h-full w-full" opacity={0.045} />
      </motion.div>

      <motion.div
        style={{ y: glowY }}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
      >
        {/* Hero teal glow */}
        <div
          className="absolute left-1/2 top-[18%] h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, rgba(20,184,166,0.32), rgba(20,184,166,0) 70%)',
          }}
        />
        {/* Warm gold ember bottom-right */}
        <div
          className="absolute right-[-10%] bottom-[-15%] h-[520px] w-[520px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, rgba(245,158,11,0.18), rgba(245,158,11,0) 70%)',
          }}
        />
      </motion.div>

      <motion.div style={{ y: starsY }}>
        <BackdropConstellation />
      </motion.div>

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <img src="/logo.png" width="52" height="52" alt="Wayra" className="rounded-full" />
          <span className="font-display text-xl text-white">Wayra</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-muted sm:flex">
          <a className="transition hover:text-white" href="#story">Our story</a>
          <a className="transition hover:text-white" href="#journeys">Journeys</a>
          <a className="transition hover:text-white" href="#login">Sign in</a>
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-14 text-center sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <img
            src="/logo.png"
            width="128"
            height="128"
            alt="Wayra"
            className="mx-auto rounded-full shadow-glow"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 flex items-center gap-3 text-[11px] font-medium tracking-[0.32em] text-gold"
        >
          <span className="h-px w-8 bg-gold/60" />
          <span>Wayra · a travel companion for two</span>
          <span className="h-px w-8 bg-gold/60" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="headline text-balance text-5xl leading-[1.05] sm:text-6xl md:text-7xl"
        >
          The world is{' '}
          <span className="relative italic">
            <span className="relative z-10 bg-gradient-to-r from-gold via-gold-soft to-gold bg-clip-text text-transparent">
              yours
            </span>
            <span
              aria-hidden
              className="absolute -bottom-1 left-0 right-0 h-[6px] rounded-full bg-gold/25 blur-md"
            />
          </span>{' '}
          to discover.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-xl text-base leading-relaxed text-mist/80 sm:text-lg"
        >
          Sketch a trip together, pin the places you dream about, and follow
          the map wherever the two of you decide to wander next.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
        >
          <a href="#login" className="btn-primary">
            Sign in to your journey
          </a>
          <a href="#story" className="btn-ghost">
            How Wayra works
          </a>
        </motion.div>

        {/* Compass rule */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.9 }}
          className="mt-20 flex items-center gap-4 text-[11px] text-muted"
        >
          <span className="h-px w-10 bg-navy-line" />
          <CompassMark />
          <span className="tracking-[0.32em]">TWO TRAVELLERS · ONE STORY</span>
          <CompassMark />
          <span className="h-px w-10 bg-navy-line" />
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-28 pt-6">
        <FeatureRow />
      </section>
    </main>
  )
}

function CompassMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <circle cx="5" cy="5" r="1.6" fill="#F59E0B" />
    </svg>
  )
}

function BackdropConstellation() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 opacity-70"
      style={{
        backgroundImage:
          'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.35) 50%, transparent 60%),\
           radial-gradient(1px 1px at 75% 20%, rgba(255,255,255,0.25) 50%, transparent 60%),\
           radial-gradient(1.2px 1.2px at 60% 70%, rgba(245,158,11,0.55) 50%, transparent 60%),\
           radial-gradient(1px 1px at 35% 80%, rgba(255,255,255,0.2) 50%, transparent 60%),\
           radial-gradient(1px 1px at 88% 55%, rgba(45,212,191,0.5) 50%, transparent 60%),\
           radial-gradient(1.2px 1.2px at 12% 65%, rgba(245,158,11,0.4) 50%, transparent 60%)',
      }}
    />
  )
}
