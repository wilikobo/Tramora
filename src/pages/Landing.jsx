import { motion } from 'framer-motion'
import Logo from '../components/Logo.jsx'

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-navy bg-radial-glow">
      <BackdropConstellation />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <span className="font-display text-xl text-white">Wayra</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-muted sm:flex">
          <a className="transition hover:text-white" href="#story">
            Our story
          </a>
          <a className="transition hover:text-white" href="#journeys">
            Journeys
          </a>
          <a className="transition hover:text-white" href="#login">
            Sign in
          </a>
        </nav>
      </header>

      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-24 pt-16 text-center sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <Logo size={112} animate />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5 text-xs font-medium tracking-[0.32em] text-teal"
        >
          Wayra · a travel companion for two
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="headline text-balance text-5xl leading-[1.05] sm:text-6xl md:text-7xl"
        >
          The world is <span className="italic text-teal-soft">yours</span> to
          discover.
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.9 }}
          className="mt-24 flex items-center gap-4 text-xs text-muted"
        >
          <span className="h-px w-10 bg-navy-line" />
          <span className="tracking-widest">Built for two travellers, one story</span>
          <span className="h-px w-10 bg-navy-line" />
        </motion.div>
      </section>
    </main>
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
           radial-gradient(1.2px 1.2px at 60% 70%, rgba(245,158,11,0.45) 50%, transparent 60%),\
           radial-gradient(1px 1px at 35% 80%, rgba(255,255,255,0.2) 50%, transparent 60%),\
           radial-gradient(1px 1px at 88% 55%, rgba(45,212,191,0.5) 50%, transparent 60%)',
      }}
    />
  )
}
