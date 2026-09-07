import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { getOrCreatePersonalTrip } from '../lib/personalTrip.js'
import { flagEmoji } from '../lib/countryCodes.js'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const STATUS_COLORS = {
  done: '#14B8A6',
  planned: '#F59E0B',
  wishlist: '#6366F1',
}
const DEFAULT_FILL = '#1E293B'
const STROKE = '#0B1220'
const STATUS_LABELS = {
  done: 'Visited',
  planned: 'Planned',
  wishlist: 'Wishlist',
}

function codeOf(geo) {
  // world-atlas stores numeric ISO 3166-1 as geo.id (e.g. 840 → US)
  return String(geo.id ?? '').padStart(3, '0')
}

function nameOf(geo) {
  return geo.properties?.name ?? 'Unknown'
}

export default function Map() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { tripId: tripIdParam } = useParams()

  const [tripId, setTripId] = useState(null)
  const [tripName, setTripName] = useState(null)
  const [tripLoading, setTripLoading] = useState(true)
  const [tripError, setTripError] = useState(null)

  const [countries, setCountries] = useState({})
  const [selected, setSelected] = useState(null)
  const [tooltip, setTooltip] = useState(null)
  const [signingOut, setSigningOut] = useState(false)

  const displayName = profile?.username ?? user?.user_metadata?.username ?? 'traveller'

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    setTripLoading(true)
    setTripError(null)

    const resolveTrip = async () => {
      if (tripIdParam) {
        const { data, error } = await supabase
          .from('trips')
          .select('id, name')
          .eq('id', tripIdParam)
          .single()
        if (error) throw error
        return data
      }
      return getOrCreatePersonalTrip(user.id)
    }

    resolveTrip()
      .then(async (trip) => {
        if (cancelled) return
        setTripId(trip.id)
        setTripName(trip.name)
        const { data, error } = await supabase
          .from('countries')
          .select('id, country_code, country_name, status, notes')
          .eq('trip_id', trip.id)
        if (error) throw error
        if (cancelled) return
        const map = {}
        for (const row of data ?? []) {
          map[row.country_code] = row
        }
        setCountries(map)
      })
      .catch((err) => {
        if (!cancelled) setTripError(err.message ?? 'Could not load your map.')
      })
      .finally(() => {
        if (!cancelled) setTripLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id, tripIdParam])

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  const upsertCountry = useCallback(
    async ({ code, name, status, notes }) => {
      if (!tripId || !user?.id) return
      const existing = countries[code]
      if (status === 'none') {
        if (existing) {
          const { error } = await supabase.from('countries').delete().eq('id', existing.id)
          if (error) throw error
          setCountries((prev) => {
            const next = { ...prev }
            delete next[code]
            return next
          })
        }
        return
      }

      const payload = {
        trip_id: tripId,
        country_code: code,
        country_name: name,
        status,
        notes: notes || null,
        added_by: user.id,
      }

      const { data, error } = await supabase
        .from('countries')
        .upsert(payload, { onConflict: 'trip_id,country_code' })
        .select('id, country_code, country_name, status, notes')
        .single()

      if (error) throw error
      setCountries((prev) => ({ ...prev, [code]: data }))
    },
    [countries, tripId, user?.id],
  )

  return (
    <main className="fixed inset-0 overflow-hidden bg-navy text-mist">
      <WorldMap
        countries={countries}
        onHover={setTooltip}
        onSelect={setSelected}
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-30">
        <div className="pointer-events-auto mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src="/logo.png" width="40" height="40" alt="Wayra" className="rounded-full" />
            <span className="font-display text-lg text-white">Wayra</span>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <NavLink to="/dashboard" className={navClass}>
              Home
            </NavLink>
            <NavLink to="/map" className={navClass} end>
              Map
            </NavLink>
            <NavLink to="/trips" className={navClass}>
              Trips
            </NavLink>
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
        </div>
      </header>

      <Legend />

      {tripLoading ? (
        <div className="pointer-events-none absolute inset-x-0 top-24 z-30 mx-auto max-w-xs rounded-full border border-navy-line bg-navy-deep/70 px-4 py-2 text-center text-[11px] tracking-[0.32em] text-muted backdrop-blur">
          LOADING YOUR PINS…
        </div>
      ) : null}

      {tripError ? (
        <div className="absolute inset-x-0 top-24 z-30 mx-auto max-w-md rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-center text-sm text-red-200">
          {tripError}
        </div>
      ) : null}

      <AnimatePresence>
        {tooltip ? (
          <motion.div
            key="tt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed z-40 rounded-md border border-navy-line bg-navy-deep/95 px-3 py-1.5 text-xs text-mist shadow-soft backdrop-blur-sm"
            style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
          >
            {tooltip.name}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selected ? (
          <CountrySidebar
            key={selected.code}
            country={selected}
            existing={countries[selected.code]}
            onClose={() => setSelected(null)}
            onSave={upsertCountry}
          />
        ) : null}
      </AnimatePresence>
    </main>
  )
}

function navClass({ isActive }) {
  return [
    'text-sm tracking-wide transition-colors',
    isActive ? 'text-white' : 'text-mist/70 hover:text-white',
  ].join(' ')
}

function Legend() {
  const items = [
    { color: STATUS_COLORS.done, label: 'Visited' },
    { color: STATUS_COLORS.planned, label: 'Planned' },
    { color: STATUS_COLORS.wishlist, label: 'Wishlist' },
  ]
  return (
    <div className="pointer-events-none absolute bottom-6 left-6 z-20 rounded-2xl border border-navy-line bg-navy-deep/80 px-4 py-3 shadow-soft backdrop-blur-sm">
      <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.32em] text-muted">
        Legend
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-mist/85">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function WorldMap({ countries, onHover, onSelect }) {
  const fillFor = (code) => {
    const row = countries[code]
    if (!row) return DEFAULT_FILL
    return STATUS_COLORS[row.status] ?? DEFAULT_FILL
  }

  return (
    <div className="absolute inset-0 z-0">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 175 }}
        width={980}
        height={520}
        style={{
          width: '100%',
          height: '100%',
          background: '#0F172A',
          display: 'block',
        }}
      >
        <ZoomableGroup center={[10, 15]} zoom={1} minZoom={1} maxZoom={5}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const code = codeOf(geo)
                const name = nameOf(geo)
                const fill = fillFor(code)
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(e) =>
                      onHover({ name, x: e.clientX, y: e.clientY })
                    }
                    onMouseMove={(e) =>
                      onHover({ name, x: e.clientX, y: e.clientY })
                    }
                    onMouseLeave={() => onHover(null)}
                    onClick={() => onSelect({ code, name })}
                    style={{
                      default: {
                        fill,
                        stroke: STROKE,
                        strokeWidth: 0.4,
                        outline: 'none',
                        transition: 'fill 200ms ease',
                      },
                      hover: {
                        fill: fill === DEFAULT_FILL ? '#334155' : fill,
                        stroke: '#2DD4BF',
                        strokeWidth: 0.75,
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: {
                        fill,
                        outline: 'none',
                      },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}

function CountrySidebar({ country, existing, onClose, onSave }) {
  const [status, setStatus] = useState(existing?.status ?? 'none')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setStatus(existing?.status ?? 'none')
    setNotes(existing?.notes ?? '')
  }, [existing])

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      await onSave({
        code: country.code,
        name: country.name,
        status,
        notes,
      })
      onClose()
    } catch (err) {
      setError(err.message ?? 'Could not save this country.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.aside
      key="sidebar"
      initial={{ x: '100%', opacity: 0.6 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 32 }}
      className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-sm flex-col border-l border-teal/20 bg-navy-deep/95 shadow-[0_0_80px_-20px_rgba(20,184,166,0.35)] backdrop-blur-xl"
    >
      <div className="flex items-start justify-between border-b border-navy-line px-6 py-6">
        <div>
          <div className="text-[11px] tracking-[0.32em] text-teal-soft">COUNTRY</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl leading-none">{flagEmoji(country.code)}</span>
            <h2 className="font-display text-2xl text-white">{country.name}</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-navy-line px-3 py-1 text-xs text-mist/70 transition-colors hover:border-teal/40 hover:text-white"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <div>
          <label className="auth-label">Status</label>
          <div className="grid grid-cols-2 gap-2">
            <StatusButton
              active={status === 'done'}
              color={STATUS_COLORS.done}
              onClick={() => setStatus('done')}
              label={STATUS_LABELS.done}
            />
            <StatusButton
              active={status === 'planned'}
              color={STATUS_COLORS.planned}
              onClick={() => setStatus('planned')}
              label={STATUS_LABELS.planned}
            />
            <StatusButton
              active={status === 'wishlist'}
              color={STATUS_COLORS.wishlist}
              onClick={() => setStatus('wishlist')}
              label={STATUS_LABELS.wishlist}
            />
            <StatusButton
              active={status === 'none'}
              color="#334155"
              onClick={() => setStatus('none')}
              label="None"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="auth-label">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="auth-input resize-none"
            placeholder="A memory, a plan, a dream…"
          />
        </div>

        {error ? (
          <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <ActivitiesSection countryId={existing?.id ?? null} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-navy-line px-6 py-5">
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-mist/70 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </motion.aside>
  )
}

const CATEGORIES = [
  { value: 'adventure', label: 'Adventure' },
  { value: 'culture', label: 'Culture' },
  { value: 'food', label: 'Food' },
  { value: 'relax', label: 'Relax' },
]

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]))

function ActivitiesSection({ countryId }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('adventure')
  const [date, setDate] = useState('')
  const [budget, setBudget] = useState('')
  const [priority, setPriority] = useState('nice')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    if (!countryId) {
      setActivities([])
      return
    }
    let cancelled = false
    setLoading(true)
    setListError(null)
    supabase
      .from('activities')
      .select('id, name, category, date_start, budget, priority')
      .eq('country_id', countryId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setListError(error.message)
        else setActivities(data ?? [])
      })
      .then(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [countryId])

  function resetForm() {
    setName('')
    setCategory('adventure')
    setDate('')
    setBudget('')
    setPriority('nice')
    setFormError(null)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!countryId) return
    const trimmed = name.trim()
    if (!trimmed) {
      setFormError('Give this activity a name.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        country_id: countryId,
        name: trimmed,
        category,
        date_start: date || null,
        budget: budget ? Number(budget) : null,
        priority,
      }
      const { data, error } = await supabase
        .from('activities')
        .insert(payload)
        .select('id, name, category, date_start, budget, priority')
        .single()
      if (error) throw error
      setActivities((prev) => [...prev, data])
      resetForm()
      setShowForm(false)
    } catch (err) {
      setFormError(err.message ?? 'Could not save activity.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    const snapshot = activities
    setActivities((prev) => prev.filter((a) => a.id !== id))
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (error) {
      setListError(error.message)
      setActivities(snapshot)
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <label className="auth-label !mb-0">Activities</label>
        {countryId ? (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="text-xs text-teal-soft transition-colors hover:text-teal"
          >
            {showForm ? 'Cancel' : '+ Add'}
          </button>
        ) : null}
      </div>

      {!countryId ? (
        <p className="rounded-lg border border-navy-line bg-navy-soft/40 px-3 py-2 text-xs text-mist/60">
          Save this country first to add activities.
        </p>
      ) : (
        <>
          {loading ? (
            <p className="text-xs text-muted">Loading…</p>
          ) : activities.length === 0 && !showForm ? (
            <p className="text-xs text-mist/60">No activities yet.</p>
          ) : (
            <ul className="space-y-2">
              {activities.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-navy-line bg-navy-soft/40 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm text-white">{a.name}</span>
                      {a.priority === 'must' ? (
                        <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[9px] font-medium tracking-wider text-gold">
                          MUST
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-mist/60">
                      {a.category ? <span>{CATEGORY_LABELS[a.category] ?? a.category}</span> : null}
                      {a.date_start ? <span>· {a.date_start}</span> : null}
                      {a.budget != null ? <span>· €{Number(a.budget).toFixed(0)}</span> : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    className="shrink-0 rounded-md border border-navy-line px-2 py-1 text-[11px] text-mist/60 transition-colors hover:border-red-400/40 hover:text-red-200"
                    aria-label="Delete activity"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {listError ? (
            <p className="mt-2 text-xs text-red-200">{listError}</p>
          ) : null}

          {showForm ? (
            <form
              onSubmit={handleAdd}
              className="mt-3 space-y-3 rounded-xl border border-navy-line bg-navy-soft/40 p-3"
            >
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Activity name"
                className="auth-input !py-2 text-sm"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="auth-input !py-2 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="auth-input !py-2 text-sm"
                >
                  <option value="must">Must</option>
                  <option value="nice">Nice</option>
                </select>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="auth-input !py-2 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Budget (€)"
                  className="auth-input !py-2 text-sm"
                />
              </div>
              {formError ? (
                <p className="text-xs text-red-200">{formError}</p>
              ) : null}
              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full !py-2 text-sm"
              >
                {saving ? 'Saving…' : 'Add activity'}
              </button>
            </form>
          ) : null}
        </>
      )}
    </div>
  )
}

function StatusButton({ active, color, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all',
        active
          ? 'border-white/60 bg-white/5 text-white'
          : 'border-navy-line bg-navy-soft/50 text-mist/80 hover:border-teal/40 hover:text-white',
      ].join(' ')}
    >
      <span
        className="inline-block h-3 w-3 rounded-sm"
        style={{ backgroundColor: color }}
      />
      {label}
    </button>
  )
}
