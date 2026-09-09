import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import FeatureRow from '../components/FeatureRow.jsx'

const HERO_PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80',
    alt: 'Mountain lake at sunrise',
    tag: 'Patagonia',
    span: 'row-span-2',
  },
  {
    src: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=700&q=80',
    alt: 'Paris rooftops',
    tag: 'Paris',
  },
  {
    src: 'https://images.unsplash.com/photo-1523592121529-f6dde35f079e?auto=format&fit=crop&w=700&q=80',
    alt: 'Japanese street lanterns',
    tag: 'Kyoto',
  },
  {
    src: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=900&q=80',
    alt: 'Sahara desert dunes',
    tag: 'Morocco',
    span: 'col-span-2',
  },
]

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-paper">
      {/* Ambient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(1000px 500px at 85% 0%, rgba(37,99,235,0.06), transparent 60%),\
             radial-gradient(700px 400px at 0% 100%, rgba(16,185,129,0.05), transparent 60%)',
        }}
      />

      {/* ── Navbar ───────────────────────────────────────────── */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" width="44" height="44" alt="Wayra" className="rounded-full" />
          <span className="font-display text-2xl text-ink">Wayra</span>
        </Link>
        <nav className="hidden items-center gap-10 text-sm font-medium text-ink-soft sm:flex">
          <a className="transition hover:text-sky" href="#features">Features</a>
          <a className="transition hover:text-sky" href="#story">Our story</a>
          <Link className="transition hover:text-sky" to="/login">Sign in</Link>
        </nav>
        <Link to="/register" className="btn-primary hidden sm:inline-flex !py-2.5 !px-5 text-sm">
          Get started
        </Link>
      </header>

      {/* ── Hero: two-column, text left · photo grid right ───── */}
      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 pb-24 pt-10 lg:grid-cols-2 lg:gap-16 lg:pt-16">
        {/* Left: copy */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky/20 bg-sky/5 px-3 py-1 text-xs font-medium text-sky-deep">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-forest" />
            Travel planner for two
          </div>

          <h1 className="headline text-balance text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
            The world is{' '}
            <span className="relative italic text-sky">
              yours
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 right-0 h-[8px] rounded-full bg-sand/40 blur-md"
              />
            </span>{' '}
            to discover.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
            Sketch a trip together, pin the places you dream about, and follow
            the map wherever the two of you decide to wander next.
          </p>

          <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
            <Link to="/register" className="btn-primary">
              Start your journey
            </Link>
            <Link to="/login" className="btn-ghost">
              Sign in
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm text-ink-muted">
            <Stat number="120+" label="Countries" tone="sky" />
            <span className="hidden h-8 w-px bg-slate-200 sm:block" />
            <Stat number="10k" label="Journeys planned" tone="forest" />
            <span className="hidden h-8 w-px bg-slate-200 sm:block" />
            <Stat number="4.9★" label="Traveller rating" tone="sand" />
          </div>
        </motion.div>

        {/* Right: photo grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="grid aspect-[5/6] grid-cols-2 grid-rows-3 gap-3 sm:gap-4">
            {HERO_PHOTOS.map((photo, i) => (
              <motion.figure
                key={photo.src}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.35 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={[
                  'group relative overflow-hidden rounded-2xl shadow-lift ring-1 ring-slate-900/5',
                  photo.span ?? '',
                ].join(' ')}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-transparent"
                />
                <figcaption className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-xs font-medium text-white">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-sand" />
                  {photo.tag}
                </figcaption>
              </motion.figure>
            ))}
          </div>

          {/* Floating accent badge */}
          <motion.div
            initial={{ opacity: 0, x: -10, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.9, delay: 0.9 }}
            className="absolute -left-4 top-6 hidden rounded-2xl bg-white p-4 shadow-lift ring-1 ring-slate-900/5 sm:block"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest/10 text-forest">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="pr-2">
                <div className="text-xs font-medium text-ink-muted">Now exploring</div>
                <div className="text-sm font-semibold text-ink">Lisbon → Faro</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.9, delay: 1.05 }}
            className="absolute -right-3 bottom-8 hidden rounded-2xl bg-white p-4 shadow-lift ring-1 ring-slate-900/5 sm:block"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky/10 text-sky">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18" />
                </svg>
              </div>
              <div className="pr-2">
                <div className="text-xs font-medium text-ink-muted">Trip progress</div>
                <div className="text-sm font-semibold text-ink">7 / 12 pins visited</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="relative z-10 border-t border-slate-100 bg-cloud">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-sky">
              How it works
            </div>
            <h2 className="headline text-4xl leading-tight sm:text-5xl">
              Everything you need to plan the next chapter.
            </h2>
            <p className="mt-4 text-ink-soft">
              From the spark of an idea to the last stamped border — Wayra keeps
              every plan, pin, and memory in one calm place.
            </p>
          </div>

          <FeatureRow />
        </div>
      </section>

      {/* ── Story CTA band ───────────────────────────────────── */}
      <section id="story" className="relative z-10 bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky via-sky-deep to-[#1E40AF] px-8 py-14 text-white shadow-lift sm:px-14 sm:py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-forest/25 blur-3xl"
            />
            <div className="relative max-w-2xl">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-white/70">
                Two travellers · One story
              </div>
              <h3 className="font-display text-3xl leading-tight sm:text-4xl">
                Your next adventure starts with a shared pin on the map.
              </h3>
              <p className="mt-4 text-white/80">
                Bring your travel companion in — dream together, plan together,
                and let the memories collect themselves.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-sky-deep transition hover:bg-cloud"
                >
                  Create your account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  I already have one
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-100 bg-paper">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-ink-muted sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/logo.png" width="24" height="24" alt="" className="rounded-full" />
            <span>© {new Date().getFullYear()} Wayra</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#story" className="hover:text-sky">Our story</a>
            <a href="#features" className="hover:text-sky">Features</a>
            <Link to="/login" className="hover:text-sky">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

function Stat({ number, label, tone }) {
  const toneColor =
    tone === 'sky' ? 'text-sky' : tone === 'forest' ? 'text-forest' : 'text-sand'
  return (
    <div>
      <div className={['font-display text-2xl leading-none', toneColor].join(' ')}>{number}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-ink-muted">{label}</div>
    </div>
  )
}
