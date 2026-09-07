import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import WorldContour from '../components/WorldContour.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const STATUS_FILL = {
  done: '#14B8A6',
  planned: '#F59E0B',
  wishlist: '#6366F1',
}
const DEFAULT_FILL = '#111C2F'
const STROKE = '#0B1220'

function greetingFor(date = new Date()) {
  const h = date.getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [stats, setStats] = useState({ trips: 0, visited: 0, planned: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [latestTrip, setLatestTrip] = useState(null)
  const [latestTripCounts, setLatestTripCounts] = useState({ done: 0, total: 0 })
  const [mapStatusByCode, setMapStatusByCode] = useState({})

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
      supabase
        .from('trips')
        .select('id, name, created_at, user1_id, user2_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('countries').select('country_code, status, trip_id'),
    ])
      .then(async ([tripsRes, visitedRes, actRes, latestRes, allCountriesRes]) => {
        if (cancelled) return
        setStats({
          trips: tripsRes.count ?? 0,
          visited: visitedRes.count ?? 0,
          planned: actRes.count ?? 0,
        })

        const trip = latestRes.data ?? null
        setLatestTrip(trip)

        const all = allCountriesRes.data ?? []
        const bestStatus = { done: 3, planned: 2, wishlist: 1 }
        const merged = {}
        for (const row of all) {
          const prev = merged[row.country_code]
          if (!prev || bestStatus[row.status] > bestStatus[prev]) {
            merged[row.country_code] = row.status
          }
        }
        setMapStatusByCode(merged)

        if (trip) {
          const forTrip = all.filter((c) => c.trip_id === trip.id)
          setLatestTripCounts({
            done: forTrip.filter((c) => c.status === 'done').length,
            total: forTrip.length,
          })
        } else {
          setLatestTripCounts({ done: 0, total: 0 })
        }
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

  const greeting = useMemo(() => greetingFor(), [])

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
        <WorldContour className="h-full w-full" opacity={0.035} />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute -left-40 top-[-10%] h-[560px] w-[720px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, rgba(20,184,166,0.16), rgba(20,184,166,0) 70%)',
          }}
        />
        <div
          className="absolute right-[-10%] top-[35%] h-[420px] w-[520px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, rgba(245,158,11,0.12), rgba(245,158,11,0) 70%)',
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

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-28 pt-6 sm:pt-12">
        <div className="text-sm text-mist/60">
          {greeting}, <span className="text-mist/80">{displayName}</span>.
        </div>
        <h1 className="mt-3 font-display text-5xl leading-tight text-white sm:text-6xl">
          Where to next
          <span className="text-gold">?</span>
        </h1>
        <p className="mt-4 max-w-xl text-base text-mist/70">
          Your journey lives here — pins, plans, and the people you're sharing them with.
        </p>

        <div className="mt-20 grid grid-cols-1 gap-10 sm:mt-24 sm:grid-cols-3">
          <StatWide
            value={stats.visited}
            label="Countries visited"
            tone="gold"
            loading={statsLoading}
          />
          <StatWide
            value={stats.trips}
            label="Trips created"
            tone="teal"
            loading={statsLoading}
          />
          <StatWide
            value={stats.planned}
            label="Activities planned"
            tone="teal"
            loading={statsLoading}
          />
        </div>

        <div className="mt-24 grid grid-cols-1 gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="text-[11px] tracking-[0.32em] text-teal-soft">
              LATEST TRIP
            </div>
            <div className="mt-4">
              {latestTrip ? (
                <LatestTripCard
                  trip={latestTrip}
                  counts={latestTripCounts}
                  onOpen={() => navigate(`/trips/${latestTrip.id}`)}
                />
              ) : (
                <div className="rounded-2xl p-8 shadow-[0_0_60px_-30px_rgba(20,184,166,0.4)] ring-1 ring-teal/10">
                  <div className="font-display text-2xl text-white">No trips yet</div>
                  <p className="mt-2 text-sm text-mist/60">
                    Start your first journey — invite a friend or plan solo.
                  </p>
                  <Link
                    to="/trips"
                    className="mt-6 inline-block text-sm text-teal-soft hover:text-teal"
                  >
                    Create a trip →
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="text-[11px] tracking-[0.32em] text-gold">
              YOUR WORLD
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl bg-navy-deep/40 shadow-[0_0_60px_-30px_rgba(20,184,166,0.35)] ring-1 ring-teal/10">
              <div className="pointer-events-none aspect-[4/3] w-full">
                <MiniWorld statusByCode={mapStatusByCode} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-mist/50">
              <LegendDot color={STATUS_FILL.done} label="Visited" />
              <LegendDot color={STATUS_FILL.planned} label="Planned" />
              <LegendDot color={STATUS_FILL.wishlist} label="Wishlist" />
            </div>
          </div>
        </div>

        <div className="mt-24 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-4">
          <Link
            to="/map"
            className="text-base text-mist/80 transition-colors hover:text-teal"
          >
            Open your map  →
          </Link>
          <Link
            to="/trips"
            className="text-base text-mist/80 transition-colors hover:text-teal"
          >
            Plan a new trip →
          </Link>
          {latestTrip ? (
            <Link
              to={`/trips/${latestTrip.id}/memories`}
              className="text-base text-mist/80 transition-colors hover:text-teal"
            >
              Add a memory →
            </Link>
          ) : (
            <Link
              to="/trips"
              className="text-base text-mist/80 transition-colors hover:text-teal"
            >
              Add a memory →
            </Link>
          )}
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

function StatWide({ value, label, tone, loading }) {
  const color = tone === 'gold' ? 'text-gold' : 'text-teal-soft'
  return (
    <div className="flex flex-col">
      <div className={['font-display text-6xl leading-none', color].join(' ')}>
        {loading ? '—' : value}
      </div>
      <div className="mt-3 text-[11px] font-medium tracking-[0.28em] text-mist/50">
        {label.toUpperCase()}
      </div>
    </div>
  )
}

function LatestTripCard({ trip, counts, onOpen }) {
  const pct = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group block w-full rounded-2xl p-8 text-left shadow-[0_0_60px_-30px_rgba(20,184,166,0.45)] ring-1 ring-teal/10 transition-shadow hover:shadow-[0_0_80px_-25px_rgba(20,184,166,0.55)]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="font-display text-3xl text-white">{trip.name}</div>
        <div className="text-xs tracking-[0.28em] text-mist/40">
          {new Date(trip.created_at).toLocaleDateString(undefined, {
            month: 'short',
            year: 'numeric',
          })}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between text-[11px] tracking-[0.24em] text-mist/50">
          <span>PROGRESS</span>
          <span className="tabular-nums text-mist/70">
            {counts.done} / {counts.total || 0} visited
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-navy-deep/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal to-gold transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-6 text-xs text-mist/50 transition-colors group-hover:text-teal-soft">
        Open this trip →
      </div>
    </button>
  )
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}

function MiniWorld({ statusByCode }) {
  return (
    <ComposableMap
      projectionConfig={{ scale: 130 }}
      width={800}
      height={480}
      style={{ width: '100%', height: '100%' }}
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const code = String(geo.id ?? '').padStart(3, '0')
            const status = statusByCode[code]
            const fill = status ? STATUS_FILL[status] : DEFAULT_FILL
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={fill}
                stroke={STROKE}
                strokeWidth={0.4}
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none', fill },
                  pressed: { outline: 'none', fill },
                }}
              />
            )
          })
        }
      </Geographies>
    </ComposableMap>
  )
}
