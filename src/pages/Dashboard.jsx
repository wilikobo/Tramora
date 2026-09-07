import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import WorldContour from '../components/WorldContour.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const displayName =
    profile?.username ??
    user?.user_metadata?.username ??
    'traveller'

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-navy">
      <div className="pointer-events-none absolute inset-0 z-0">
        <WorldContour className="h-full w-full" opacity={0.045} />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute left-1/2 top-[10%] h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, rgba(20,184,166,0.22), rgba(20,184,166,0) 70%)',
          }}
        />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" width="44" height="44" alt="Wayra" className="rounded-full" />
          <span className="font-display text-xl text-white">Wayra</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-6">
          <NavLink to="/dashboard" className={navClass} end>
            Home
          </NavLink>
          <NavLink to="/map" className={navClass}>
            Map
          </NavLink>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="btn-ghost"
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-6 text-center sm:pt-10">
        <div className="mb-5 flex items-center justify-center gap-3 text-[11px] font-medium tracking-[0.32em] text-gold">
          <span className="h-px w-8 bg-gold/60" />
          <span>YOUR JOURNEY</span>
          <span className="h-px w-8 bg-gold/60" />
        </div>

        <h1 className="headline text-balance text-3xl leading-tight sm:text-4xl">
          Welcome back,{' '}
          <span className="italic">
            <span className="bg-gradient-to-r from-gold via-gold-soft to-gold bg-clip-text text-transparent">
              {displayName}
            </span>
          </span>
          .
        </h1>

        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-mist/70">
          <span>Signed in as {displayName}</span>
          <span className="text-navy-line">•</span>
          <Link
            to="/profile"
            className="text-teal-soft transition-colors hover:text-teal"
          >
            Edit profile
          </Link>
        </div>

        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-mist/80">
          Your map is waiting. Trips, pins, and shared plans will land here soon —
          for now, everything's set up and ready for your first journey together.
        </p>

        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          <PlaceholderCard label="Trips" hint="Start a new journey" />
          <Link
            to="/map"
            className="group rounded-2xl border border-teal/30 bg-teal/5 p-6 text-left shadow-soft backdrop-blur-sm transition-colors hover:border-teal/60 hover:bg-teal/10"
          >
            <div className="text-[11px] tracking-[0.32em] text-teal-soft">COUNTRIES</div>
            <div className="mt-3 font-display text-2xl text-white">Open map</div>
            <div className="mt-1 text-sm text-mist/70">Pin the world</div>
          </Link>
          <PlaceholderCard label="Activities" hint="Vote on plans" />
        </div>
      </section>
    </main>
  )
}

function navClass({ isActive }) {
  return [
    'text-sm tracking-wide transition-colors',
    isActive ? 'text-white' : 'text-mist/70 hover:text-white',
  ].join(' ')
}

function PlaceholderCard({ label, hint }) {
  return (
    <div className="rounded-2xl border border-navy-line bg-navy-soft/50 p-6 text-left shadow-soft backdrop-blur-sm">
      <div className="text-[11px] tracking-[0.32em] text-muted">{label.toUpperCase()}</div>
      <div className="mt-3 font-display text-2xl text-white">Soon</div>
      <div className="mt-1 text-sm text-mist/60">{hint}</div>
    </div>
  )
}
