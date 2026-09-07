import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import WorldContour from '../components/WorldContour.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [stats, setStats] = useState({ trips: 0, visited: 0, planned: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    setStatsLoading(true)

    Promise.all([
      supabase.from('trips').select('id', { count: 'exact', head: true }),
      supabase
        .from('countries')
        .select('country_code', { count: 'exact', head: true })
        .eq('status', 'done'),
      supabase.from('activities').select('id', { count: 'exact', head: true }),
    ])
      .then(([tripsRes, visitedRes, actRes]) => {
        if (cancelled) return
        setStats({
          trips: tripsRes.count ?? 0,
          visited: visitedRes.count ?? 0,
          planned: actRes.count ?? 0,
        })
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user?.id])

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
        <Link to="/dashboard" className="flex items-center gap-3">
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
          <NavLink to="/trips" className={navClass}>
            Trips
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

        <div className="mx-auto mt-10 flex max-w-md items-stretch justify-center gap-3 sm:gap-6">
          <Stat value={stats.trips} label="Trips" tone="teal" loading={statsLoading} />
          <Stat value={stats.visited} label="Countries visited" tone="gold" loading={statsLoading} />
          <Stat value={stats.planned} label="Activities planned" tone="teal" loading={statsLoading} />
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            to="/trips"
            className="group rounded-2xl border border-gold/30 bg-gold/5 p-6 text-left shadow-soft backdrop-blur-sm transition-colors hover:border-gold/60 hover:bg-gold/10"
          >
            <div className="text-[11px] tracking-[0.32em] text-gold">TRIPS</div>
            <div className="mt-3 font-display text-2xl text-white">Plan together</div>
            <div className="mt-1 text-sm text-mist/70">Invite a partner</div>
          </Link>
          <Link
            to="/map"
            className="group rounded-2xl border border-teal/30 bg-teal/5 p-6 text-left shadow-soft backdrop-blur-sm transition-colors hover:border-teal/60 hover:bg-teal/10"
          >
            <div className="text-[11px] tracking-[0.32em] text-teal-soft">COUNTRIES</div>
            <div className="mt-3 font-display text-2xl text-white">Open map</div>
            <div className="mt-1 text-sm text-mist/70">Pin the world</div>
          </Link>
          <Link
            to="/trips"
            className="group rounded-2xl border border-navy-line bg-navy-soft/50 p-6 text-left shadow-soft backdrop-blur-sm transition-colors hover:border-teal/50 hover:bg-teal/5"
          >
            <div className="text-[11px] tracking-[0.32em] text-teal-soft">ACTIVITIES</div>
            <div className="mt-3 font-display text-2xl text-white">Vote on plans</div>
            <div className="mt-1 text-sm text-mist/70">Open a trip to see activities</div>
          </Link>
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

function Stat({ value, label, tone, loading }) {
  const color = tone === 'gold' ? 'text-gold' : 'text-teal-soft'
  return (
    <div className="flex flex-1 flex-col items-center rounded-xl border border-navy-line bg-navy-soft/40 px-3 py-3 text-center backdrop-blur-sm">
      <div className={['font-display text-3xl leading-none', color].join(' ')}>
        {loading ? '—' : value}
      </div>
      <div className="mt-1.5 text-[10px] font-medium tracking-[0.24em] text-mist/60">
        {label.toUpperCase()}
      </div>
    </div>
  )
}

