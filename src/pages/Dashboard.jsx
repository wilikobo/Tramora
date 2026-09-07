import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import WorldContour from '../components/WorldContour.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const displayName =
    profile?.username ??
    user?.user_metadata?.username ??
    user?.email?.split('@')[0] ??
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
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="btn-ghost"
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </header>

      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-10 text-center sm:pt-16">
        <div className="mb-6 flex items-center justify-center gap-3 text-[11px] font-medium tracking-[0.32em] text-gold">
          <span className="h-px w-8 bg-gold/60" />
          <span>YOUR JOURNEY</span>
          <span className="h-px w-8 bg-gold/60" />
        </div>

        <h1 className="headline text-balance text-5xl leading-[1.05] sm:text-6xl">
          Welcome back,{' '}
          <span className="italic">
            <span className="bg-gradient-to-r from-gold via-gold-soft to-gold bg-clip-text text-transparent">
              {displayName}
            </span>
          </span>
          .
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-mist/80 sm:text-lg">
          Your map is waiting. Trips, pins, and shared plans will land here soon —
          for now, everything's set up and ready for your first journey together.
        </p>

        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          <PlaceholderCard label="Trips" hint="Start a new journey" />
          <PlaceholderCard label="Countries" hint="Pin the map" />
          <PlaceholderCard label="Activities" hint="Vote on plans" />
        </div>
      </section>
    </main>
  )
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
