import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// The mini-world stays dark for contrast against the light UI (per spec).
const STATUS_FILL = {
  done: '#10B981',
  planned: '#F59E0B',
  wishlist: '#6366F1',
}
const DEFAULT_FILL = '#1E293B'
const STROKE = '#0F172A'

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
    <main className="relative min-h-screen bg-cloud">
      {/* ── Top nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src="/logo.png" width="36" height="36" alt="Wayra" className="rounded-full" />
            <span className="font-display text-xl text-ink">Wayra</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/dashboard" className={navClass} end>Home</NavLink>
            <NavLink to="/map" className={navClass}>Map</NavLink>
            <NavLink to="/trips" className={navClass}>Trips</NavLink>
            <NavLink to="/profile" className={navClass}>Profile</NavLink>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="ml-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-sky/40 hover:text-sky"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        {/* ── Hello + hero ───────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-sm text-ink-muted">
              {greeting}, <span className="font-medium text-ink">{displayName}</span>.
            </div>
            <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">
              Where to next<span className="text-sand">?</span>
            </h1>
            <p className="mt-3 max-w-xl text-ink-soft">
              Your journey lives here — pins, plans, and the people you're sharing them with.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/trips" className="btn-primary !py-2.5 !px-5 text-sm">New trip</Link>
            <Link to="/map" className="btn-ghost !py-2.5 !px-5 text-sm">Open map</Link>
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StatCard
            value={stats.visited}
            label="Countries visited"
            tone="forest"
            loading={statsLoading}
            icon={<PinIcon />}
          />
          <StatCard
            value={stats.trips}
            label="Trips created"
            tone="sky"
            loading={statsLoading}
            icon={<SuitcaseIcon />}
          />
          <StatCard
            value={stats.planned}
            label="Activities planned"
            tone="sand"
            loading={statsLoading}
            icon={<SparkIcon />}
          />
        </div>

        {/* ── Latest trip + mini world ──────────────────────── */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SectionLabel>Latest trip</SectionLabel>
            {latestTrip ? (
              <LatestTripCard
                trip={latestTrip}
                counts={latestTripCounts}
                onOpen={() => navigate(`/trips/${latestTrip.id}`)}
              />
            ) : (
              <div className="card p-8">
                <div className="font-display text-2xl text-ink">No trips yet</div>
                <p className="mt-2 text-sm text-ink-soft">
                  Start your first journey — invite a friend or plan solo.
                </p>
                <Link to="/trips" className="mt-6 inline-block text-sm font-medium text-sky hover:text-sky-deep">
                  Create a trip →
                </Link>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <SectionLabel>Your world</SectionLabel>
            <div className="overflow-hidden rounded-2xl bg-[#0F172A] shadow-lift ring-1 ring-slate-900/5">
              <div className="pointer-events-none aspect-[4/3] w-full">
                <MiniWorld statusByCode={mapStatusByCode} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
              <LegendDot color={STATUS_FILL.done} label="Visited" />
              <LegendDot color={STATUS_FILL.planned} label="Planned" />
              <LegendDot color={STATUS_FILL.wishlist} label="Wishlist" />
            </div>
          </div>
        </div>

        {/* ── Quick actions ─────────────────────────────────── */}
        <div className="mt-12">
          <SectionLabel>Quick actions</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <QuickCard
              to="/map"
              title="Open your map"
              body="See every pin from every trip in one view."
              tone="sky"
            />
            <QuickCard
              to="/trips"
              title="Plan a new trip"
              body="Sketch dates, invite your companion, drop pins."
              tone="forest"
            />
            <QuickCard
              to={latestTrip ? `/trips/${latestTrip.id}/memories` : '/trips'}
              title="Add a memory"
              body="Photos, notes, moments — pinned to the map."
              tone="sand"
            />
          </div>
        </div>
      </section>
    </main>
  )
}

function navClass({ isActive }) {
  return [
    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-sky/10 text-sky-deep'
      : 'text-ink-soft hover:bg-slate-100 hover:text-ink',
  ].join(' ')
}

function SectionLabel({ children }) {
  return (
    <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-ink-muted">
      {children}
    </div>
  )
}

function StatCard({ value, label, tone, loading, icon }) {
  const toneClasses = {
    sky: { bg: 'bg-sky/10', text: 'text-sky' },
    forest: { bg: 'bg-forest/10', text: 'text-forest' },
    sand: { bg: 'bg-sand/15', text: 'text-[#B45309]' },
  }[tone]

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div className={['flex h-10 w-10 items-center justify-center rounded-xl', toneClasses.bg, toneClasses.text].join(' ')}>
          {icon}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
          {label}
        </span>
      </div>
      <div className={['mt-6 font-display text-5xl leading-none', toneClasses.text].join(' ')}>
        {loading ? '—' : value}
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
      className="group block w-full rounded-2xl border border-slate-100 bg-white p-8 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="font-display text-3xl text-ink">{trip.name}</div>
        <div className="text-xs font-medium uppercase tracking-widest text-ink-muted">
          {new Date(trip.created_at).toLocaleDateString(undefined, {
            month: 'short',
            year: 'numeric',
          })}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
          <span className="uppercase tracking-widest">Progress</span>
          <span className="tabular-nums text-ink">
            {counts.done} / {counts.total || 0} visited
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky to-forest transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-6 text-sm font-medium text-sky transition-colors group-hover:text-sky-deep">
        Open this trip →
      </div>
    </button>
  )
}

function QuickCard({ to, title, body, tone }) {
  const toneClasses = {
    sky: 'from-sky/10 to-sky/5 text-sky',
    forest: 'from-forest/10 to-forest/5 text-forest',
    sand: 'from-sand/20 to-sand/5 text-[#B45309]',
  }[tone]

  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className={['mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br', toneClasses].join(' ')}>
        <ArrowIcon />
      </div>
      <div className="font-display text-lg text-ink">{title}</div>
      <div className="mt-1 text-sm text-ink-soft">{body}</div>
    </Link>
  )
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
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

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function SuitcaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
      <path d="M3 12h18" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />
    </svg>
  )
}
