import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import WorldContour from '../components/WorldContour.jsx'
import TripTabs from '../components/TripTabs.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { flagEmoji } from '../lib/countryCodes.js'

export default function Memories() {
  const { tripId } = useParams()
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [countries, setCountries] = useState([])
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [signingOut, setSigningOut] = useState(false)

  const displayName = profile?.username ?? user?.user_metadata?.username ?? 'traveller'

  const loadAll = useCallback(async () => {
    if (!tripId) return
    setLoading(true)
    setError(null)
    try {
      const { data: tripRow, error: tripErr } = await supabase
        .from('trips')
        .select('id, name')
        .eq('id', tripId)
        .single()
      if (tripErr) throw tripErr
      setTrip(tripRow)

      const { data: countryRows, error: countryErr } = await supabase
        .from('countries')
        .select('id, country_code, country_name, status')
        .eq('trip_id', tripId)
        .eq('status', 'done')
        .order('country_name', { ascending: true })
      if (countryErr) throw countryErr
      setCountries(countryRows ?? [])

      const ids = (countryRows ?? []).map((c) => c.id)
      if (ids.length === 0) {
        setMemories([])
      } else {
        const { data: memRows, error: memErr } = await supabase
          .from('memories')
          .select('id, country_id, user_id, photo_url, note, visit_date, created_at')
          .in('country_id', ids)
          .order('visit_date', { ascending: false, nullsFirst: false })
        if (memErr) throw memErr
        setMemories(memRows ?? [])
      }
    } catch (err) {
      setError(err.message ?? 'Could not load memories.')
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  const grouped = useMemo(() => {
    const byCountry = {}
    for (const c of countries) byCountry[c.id] = { country: c, items: [] }
    for (const m of memories) {
      if (byCountry[m.country_id]) byCountry[m.country_id].items.push(m)
    }
    return Object.values(byCountry).filter((g) => g.items.length > 0)
  }, [countries, memories])

  async function handleDelete(id) {
    const snapshot = memories
    setMemories((prev) => prev.filter((m) => m.id !== id))
    const { error: delErr } = await supabase.from('memories').delete().eq('id', id)
    if (delErr) {
      setError(delErr.message)
      setMemories(snapshot)
    }
  }

  return (
    <main className="relative min-h-screen bg-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <WorldContour className="h-full w-full" color="#2563EB" opacity={0.03} />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src="/logo.png" width="44" height="44" alt="Wayra" className="rounded-full" />
          <span className="font-display text-xl text-ink">Wayra</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-6">
          <NavLink to="/dashboard" className={navClass} end>Home</NavLink>
          <NavLink to="/map" className={navClass}>Map</NavLink>
          <NavLink to="/trips" className={navClass}>Trips</NavLink>
          <span className="hidden text-sm text-mist/60 sm:inline">{displayName}</span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="btn-ghost !px-4 !py-2 text-sm"
          >
            {signingOut ? '…' : 'Sign out'}
          </button>
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-2">
        <div className="mb-4 flex items-center gap-3 text-[11px] font-medium tracking-[0.32em] text-gold">
          <span className="h-px w-8 bg-gold/60" />
          <span>MEMORIES</span>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="headline text-3xl sm:text-4xl">
              {trip?.name ? <>{trip.name}<span className="text-gold">.</span></> : 'Memories.'}
            </h1>
            <p className="mt-2 text-mist/70">
              Photos and notes from the places you've actually been.
            </p>
          </div>
          <Link
            to={`/trips/${tripId}`}
            className="btn-ghost !px-4 !py-2 text-sm"
          >
            Add via map →
          </Link>
        </div>

        <div className="mt-6 flex justify-center">
          <TripTabs tripId={tripId} />
        </div>

        {error ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-10">
          {loading ? (
            <p className="text-sm text-mist/60">Loading memories…</p>
          ) : grouped.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
              <p className="text-mist/80">No memories yet.</p>
              <p className="mt-1 text-sm text-mist/50">
                Mark a country as <span className="text-sky">Visited</span> on the map, then add photos and notes in its side panel.
              </p>
              <div className="mt-6">
                <Link to={`/trips/${tripId}`} className="btn-ghost !px-4 !py-2 text-sm">
                  Open trip map
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {grouped.map(({ country, items }) => (
                <div key={country.id}>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-2xl leading-none">{flagEmoji(country.country_code)}</span>
                    <h2 className="font-display text-xl text-ink">{country.country_name}</h2>
                    <span className="text-xs tracking-widest text-mist/50">
                      {items.length} {items.length === 1 ? 'MEMORY' : 'MEMORIES'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((m) => (
                      <MemoryCard
                        key={m.id}
                        memory={m}
                        canDelete={m.user_id === user?.id}
                        onDelete={() => handleDelete(m.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function MemoryCard({ memory, canDelete, onDelete }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {memory.photo_url ? (
        <a href={memory.photo_url} target="_blank" rel="noreferrer" className="block">
          <img
            src={memory.photo_url}
            alt={memory.note ?? 'memory'}
            className="h-56 w-full object-cover transition-transform group-hover:scale-105"
          />
        </a>
      ) : (
        <div className="flex h-56 w-full items-center justify-center bg-white text-mist/40">
          <span className="text-xs tracking-widest">NO PHOTO</span>
        </div>
      )}
      <div className="p-4">
        {memory.visit_date ? (
          <div className="text-[10px] tracking-widest text-gold">{memory.visit_date}</div>
        ) : null}
        {memory.note ? (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-mist">{memory.note}</p>
        ) : null}
      </div>
      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="absolute right-3 top-3 rounded-full border border-slate-200 bg-ink/60 px-2 py-0.5 text-[11px] text-mist/70 opacity-0 transition-all hover:border-red-400/50 hover:text-red-700 focus:opacity-100 group-hover:opacity-100"
          aria-label="Delete memory"
        >
          ✕
        </button>
      ) : null}
    </div>
  )
}

function navClass({ isActive }) {
  return [
    'text-sm tracking-wide transition-colors',
    isActive ? 'text-ink' : 'text-mist/70 hover:text-ink',
  ].join(' ')
}
