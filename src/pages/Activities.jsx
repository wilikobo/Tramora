import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import WorldContour from '../components/WorldContour.jsx'
import TripTabs from '../components/TripTabs.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { flagEmoji } from '../lib/countryCodes.js'

const CATEGORIES = [
  { value: 'adventure', label: 'Adventure', icon: '🏔️' },
  { value: 'culture', label: 'Culture', icon: '🏛️' },
  { value: 'food', label: 'Food', icon: '🍜' },
  { value: 'relax', label: 'Relax', icon: '🌴' },
]
const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]))

export default function Activities() {
  const { tripId } = useParams()
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [countries, setCountries] = useState([])
  const [activities, setActivities] = useState([])
  const [votes, setVotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [signingOut, setSigningOut] = useState(false)

  const [fCountry, setFCountry] = useState('all')
  const [fCategory, setFCategory] = useState('all')
  const [fPriority, setFPriority] = useState('all')
  const [fStatus, setFStatus] = useState('all')

  const [showAddModal, setShowAddModal] = useState(false)

  const displayName = profile?.username ?? user?.user_metadata?.username ?? 'traveller'

  const loadAll = useCallback(async () => {
    if (!tripId || !user?.id) return
    setLoading(true)
    setError(null)
    try {
      const { data: tripRow, error: tripErr } = await supabase
        .from('trips')
        .select('id, name, user1_id, user2_id, invited_email')
        .eq('id', tripId)
        .single()
      if (tripErr) throw tripErr
      setTrip(tripRow)

      const { data: countryRows, error: countryErr } = await supabase
        .from('countries')
        .select('id, country_code, country_name')
        .eq('trip_id', tripId)
        .order('country_name', { ascending: true })
      if (countryErr) throw countryErr
      setCountries(countryRows ?? [])

      const countryIds = (countryRows ?? []).map((c) => c.id)
      if (countryIds.length === 0) {
        setActivities([])
        setVotes([])
      } else {
        const { data: actRows, error: actErr } = await supabase
          .from('activities')
          .select('id, country_id, name, category, date_start, budget, priority, status')
          .in('country_id', countryIds)
          .order('date_start', { ascending: true, nullsFirst: false })
        if (actErr) throw actErr
        setActivities(actRows ?? [])

        const activityIds = (actRows ?? []).map((a) => a.id)
        if (activityIds.length === 0) {
          setVotes([])
        } else {
          const { data: voteRows, error: voteErr } = await supabase
            .from('votes')
            .select('id, activity_id, user_id, vote')
            .in('activity_id', activityIds)
          if (voteErr) throw voteErr
          setVotes(voteRows ?? [])
        }
      }
    } catch (err) {
      setError(err.message ?? 'Could not load this trip.')
    } finally {
      setLoading(false)
    }
  }, [tripId, user?.id])

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

  const countryById = useMemo(() => {
    const map = {}
    for (const c of countries) map[c.id] = c
    return map
  }, [countries])

  const votesByActivity = useMemo(() => {
    const map = {}
    for (const v of votes) {
      if (!map[v.activity_id]) map[v.activity_id] = []
      map[v.activity_id].push(v)
    }
    return map
  }, [votes])

  const tripHasTwoMembers = Boolean(trip?.user1_id && trip?.user2_id)

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (fCountry !== 'all' && a.country_id !== fCountry) return false
      if (fCategory !== 'all' && a.category !== fCategory) return false
      if (fPriority !== 'all' && a.priority !== fPriority) return false
      if (fStatus !== 'all' && a.status !== fStatus) return false
      return true
    })
  }, [activities, fCountry, fCategory, fPriority, fStatus])

  async function castVote(activityId, nextVote) {
    if (!user?.id) return
    const existing = votes.find(
      (v) => v.activity_id === activityId && v.user_id === user.id,
    )

    if (existing && existing.vote === nextVote) {
      // toggle off — retract the vote
      const snapshot = votes
      setVotes((prev) => prev.filter((v) => v.id !== existing.id))
      const { error: delErr } = await supabase
        .from('votes')
        .delete()
        .eq('id', existing.id)
      if (delErr) {
        setVotes(snapshot)
        setError(delErr.message)
      }
      return
    }

    if (existing) {
      const snapshot = votes
      setVotes((prev) =>
        prev.map((v) => (v.id === existing.id ? { ...v, vote: nextVote } : v)),
      )
      const { error: updErr } = await supabase
        .from('votes')
        .update({ vote: nextVote })
        .eq('id', existing.id)
      if (updErr) {
        setVotes(snapshot)
        setError(updErr.message)
      }
      return
    }

    const { data, error: insErr } = await supabase
      .from('votes')
      .insert({ activity_id: activityId, user_id: user.id, vote: nextVote })
      .select('id, activity_id, user_id, vote')
      .single()
    if (insErr) {
      setError(insErr.message)
      return
    }
    setVotes((prev) => [...prev, data])
  }

  async function toggleStatus(activity) {
    const nextStatus = activity.status === 'done' ? 'planned' : 'done'
    const snapshot = activities
    setActivities((prev) =>
      prev.map((a) => (a.id === activity.id ? { ...a, status: nextStatus } : a)),
    )
    const { error: updErr } = await supabase
      .from('activities')
      .update({ status: nextStatus })
      .eq('id', activity.id)
    if (updErr) {
      setActivities(snapshot)
      setError(updErr.message)
    }
  }

  async function deleteActivity(activityId) {
    const snapshot = activities
    setActivities((prev) => prev.filter((a) => a.id !== activityId))
    const { error: delErr } = await supabase.from('activities').delete().eq('id', activityId)
    if (delErr) {
      setActivities(snapshot)
      setError(delErr.message)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-navy">
      <div className="pointer-events-none absolute inset-0 z-0">
        <WorldContour className="h-full w-full" opacity={0.04} />
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
          <span>ACTIVITIES</span>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="headline text-3xl sm:text-4xl">
              {trip?.name ? <>{trip.name}<span className="text-gold">.</span></> : 'Trip activities.'}
            </h1>
            <p className="mt-2 text-mist/70">
              Every plan across every country. Vote, filter, decide together.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              + Add activity
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <TripTabs tripId={tripId} />
        </div>

        <FilterBar
          countries={countries}
          fCountry={fCountry}
          setFCountry={setFCountry}
          fCategory={fCategory}
          setFCategory={setFCategory}
          fPriority={fPriority}
          setFPriority={setFPriority}
          fStatus={fStatus}
          setFStatus={setFStatus}
          onReset={() => {
            setFCountry('all')
            setFCategory('all')
            setFPriority('all')
            setFStatus('all')
          }}
        />

        {error ? (
          <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <div className="mt-8">
          {loading ? (
            <p className="text-sm text-mist/60">Loading activities…</p>
          ) : activities.length === 0 ? (
            <EmptyState tripId={tripId} hasCountries={countries.length > 0} />
          ) : filtered.length === 0 ? (
            <p className="rounded-2xl border border-navy-line bg-navy-soft/40 px-6 py-10 text-center text-mist/70">
              No activities match those filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((a) => (
                <ActivityCard
                  key={a.id}
                  activity={a}
                  country={countryById[a.country_id]}
                  votes={votesByActivity[a.id] ?? []}
                  userId={user?.id}
                  tripHasTwoMembers={tripHasTwoMembers}
                  onVote={castVote}
                  onToggleStatus={toggleStatus}
                  onDelete={deleteActivity}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {showAddModal ? (
          <AddActivityModal
            countries={countries}
            tripId={tripId}
            onClose={() => setShowAddModal(false)}
            onCreated={(activity) => {
              setActivities((prev) => [...prev, activity])
              setShowAddModal(false)
            }}
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

function EmptyState({ tripId, hasCountries }) {
  return (
    <div className="rounded-2xl border border-navy-line bg-navy-soft/40 px-6 py-12 text-center">
      <p className="text-mist/80">No activities yet.</p>
      <p className="mt-1 text-sm text-mist/50">
        {hasCountries
          ? 'Add your first plan — Add activity above.'
          : 'Pin a country on the map first, then plan what you’ll do there.'}
      </p>
      <div className="mt-6">
        <Link to={`/trips/${tripId}`} className="btn-ghost !px-4 !py-2 text-sm">
          Open trip map
        </Link>
      </div>
    </div>
  )
}

function FilterBar({
  countries,
  fCountry,
  setFCountry,
  fCategory,
  setFCategory,
  fPriority,
  setFPriority,
  fStatus,
  setFStatus,
  onReset,
}) {
  const anyActive =
    fCountry !== 'all' || fCategory !== 'all' || fPriority !== 'all' || fStatus !== 'all'

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-navy-line bg-navy-soft/40 px-4 py-3">
      <FilterSelect
        label="Country"
        value={fCountry}
        onChange={setFCountry}
        options={[
          { value: 'all', label: 'All countries' },
          ...countries.map((c) => ({ value: c.id, label: c.country_name })),
        ]}
      />
      <FilterSelect
        label="Category"
        value={fCategory}
        onChange={setFCategory}
        options={[
          { value: 'all', label: 'All categories' },
          ...CATEGORIES.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` })),
        ]}
      />
      <FilterSelect
        label="Priority"
        value={fPriority}
        onChange={setFPriority}
        options={[
          { value: 'all', label: 'All priorities' },
          { value: 'must', label: 'Must' },
          { value: 'nice', label: 'Nice' },
        ]}
      />
      <FilterSelect
        label="Status"
        value={fStatus}
        onChange={setFStatus}
        options={[
          { value: 'all', label: 'All statuses' },
          { value: 'planned', label: 'Planned' },
          { value: 'done', label: 'Done' },
        ]}
      />
      {anyActive ? (
        <button
          type="button"
          onClick={onReset}
          className="ml-auto text-xs text-mist/60 hover:text-white"
        >
          Reset filters
        </button>
      ) : null}
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-2 text-xs text-mist/70">
      <span className="tracking-[0.24em] text-muted">{label.toUpperCase()}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-navy-line bg-navy-deep/70 px-2 py-1.5 text-sm text-mist focus:border-teal/60 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ActivityCard({
  activity,
  country,
  votes,
  userId,
  tripHasTwoMembers,
  onVote,
  onToggleStatus,
  onDelete,
}) {
  const yesCount = votes.filter((v) => v.vote === 'yes').length
  const noCount = votes.filter((v) => v.vote === 'no').length
  const myVote = votes.find((v) => v.user_id === userId)?.vote ?? null

  const confirmed = tripHasTwoMembers ? yesCount >= 2 : yesCount >= 1
  const discussion = noCount > 0 && !confirmed
  const isDone = activity.status === 'done'

  const cat = CATEGORY_MAP[activity.category]

  const borderClass = confirmed
    ? 'border-emerald-400/60 bg-emerald-400/5 shadow-[0_0_60px_-25px_rgba(52,211,153,0.6)]'
    : discussion
      ? 'border-orange-400/60 bg-orange-400/5 shadow-[0_0_60px_-25px_rgba(251,146,60,0.55)]'
      : 'border-navy-line bg-navy-soft/50'

  return (
    <div
      className={[
        'group relative flex flex-col rounded-2xl border p-5 transition-colors',
        borderClass,
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => onDelete(activity.id)}
        className="absolute right-3 top-3 rounded-full border border-navy-line bg-navy-deep/70 px-2 py-0.5 text-[11px] text-mist/60 opacity-0 transition-all hover:border-red-400/50 hover:text-red-200 focus:opacity-100 group-hover:opacity-100"
        aria-label={`Delete ${activity.name}`}
      >
        ✕
      </button>

      <div className="flex items-center gap-2 text-[11px] tracking-[0.32em] text-mist/60">
        <span className="text-base leading-none">{cat?.icon ?? '📍'}</span>
        <span>{(cat?.label ?? activity.category ?? 'ACTIVITY').toUpperCase()}</span>
        {activity.priority === 'must' ? (
          <span className="ml-1 rounded-full bg-gold/25 px-2 py-0.5 text-[9px] font-medium tracking-widest text-gold">
            MUST
          </span>
        ) : (
          <span className="ml-1 rounded-full border border-navy-line px-2 py-0.5 text-[9px] tracking-widest text-mist/50">
            NICE
          </span>
        )}
      </div>

      <div className="mt-2 pr-6 font-display text-xl leading-snug text-white">
        {activity.name}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-mist/70">
        {country ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="text-base leading-none">{flagEmoji(country.country_code)}</span>
            <span>{country.country_name}</span>
          </span>
        ) : (
          <span className="text-mist/50">Unknown country</span>
        )}
        {activity.date_start ? (
          <>
            <span className="text-navy-line">·</span>
            <span>{activity.date_start}</span>
          </>
        ) : null}
        {activity.budget != null ? (
          <>
            <span className="text-navy-line">·</span>
            <span>€{Number(activity.budget).toFixed(0)}</span>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <VoteButton
            emoji="👍"
            count={yesCount}
            active={myVote === 'yes'}
            tone="yes"
            onClick={() => onVote(activity.id, 'yes')}
          />
          <VoteButton
            emoji="👎"
            count={noCount}
            active={myVote === 'no'}
            tone="no"
            onClick={() => onVote(activity.id, 'no')}
          />
        </div>
        <button
          type="button"
          onClick={() => onToggleStatus(activity)}
          className={[
            'rounded-full border px-3 py-1 text-[11px] tracking-widest transition-colors',
            isDone
              ? 'border-teal/50 bg-teal/15 text-teal-soft'
              : 'border-navy-line text-mist/60 hover:border-teal/40 hover:text-white',
          ].join(' ')}
          aria-label="Toggle status"
        >
          {isDone ? '✓ DONE' : 'PLANNED'}
        </button>
      </div>

      {confirmed ? (
        <div className="mt-3 text-[11px] tracking-widest text-emerald-300">
          ✓ CONFIRMED · BOTH IN
        </div>
      ) : discussion ? (
        <div className="mt-3 text-[11px] tracking-widest text-orange-300">
          ⚠ NEEDS A CHAT
        </div>
      ) : null}
    </div>
  )
}

function VoteButton({ emoji, count, active, tone, onClick }) {
  const activeClass =
    tone === 'yes'
      ? 'border-emerald-400/70 bg-emerald-400/15 text-emerald-200'
      : 'border-orange-400/70 bg-orange-400/15 text-orange-200'
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-all',
        active
          ? activeClass
          : 'border-navy-line bg-navy-deep/50 text-mist/80 hover:border-teal/40 hover:text-white',
      ].join(' ')}
    >
      <span className="leading-none">{emoji}</span>
      <span className="text-xs tabular-nums">{count}</span>
    </button>
  )
}

function AddActivityModal({ countries, tripId, onClose, onCreated }) {
  const navigate = useNavigate()

  const [countryId, setCountryId] = useState(countries[0]?.id ?? '')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('adventure')
  const [date, setDate] = useState('')
  const [budget, setBudget] = useState('')
  const [priority, setPriority] = useState('nice')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const noCountries = countries.length === 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (noCountries) return
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Give this activity a name.')
      return
    }
    if (!countryId) {
      setError('Pick a country first.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        country_id: countryId,
        name: trimmed,
        category,
        date_start: date || null,
        budget: budget ? Number(budget) : null,
        priority,
      }
      const { data, error: insErr } = await supabase
        .from('activities')
        .insert(payload)
        .select('id, country_id, name, category, date_start, budget, priority, status')
        .single()
      if (insErr) throw insErr
      onCreated(data)
    } catch (err) {
      setError(err.message ?? 'Could not save activity.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/80 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="w-full max-w-md rounded-2xl border border-teal/20 bg-navy-soft/95 p-6 shadow-[0_0_80px_-20px_rgba(20,184,166,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="text-[11px] tracking-[0.32em] text-teal-soft">NEW ACTIVITY</div>
            <h2 className="mt-2 font-display text-2xl text-white">Add a plan</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-navy-line px-3 py-1 text-xs text-mist/70 hover:border-teal/40 hover:text-white"
          >
            ✕
          </button>
        </div>

        {noCountries ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-3 text-sm text-mist">
              Pin a country on the map first — an activity always lives inside a country.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-mist/70 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => navigate(`/trips/${tripId}`)}
                className="btn-primary"
              >
                Open map
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="act-country" className="auth-label">Country</label>
              <select
                id="act-country"
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
                className="auth-input"
                required
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.country_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="act-name" className="auth-label">Activity name</label>
              <input
                id="act-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
                placeholder="e.g. Hike Mount Fuji"
                autoFocus
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="act-cat" className="auth-label">Category</label>
                <select
                  id="act-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="auth-input"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="act-priority" className="auth-label">Priority</label>
                <select
                  id="act-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="auth-input"
                >
                  <option value="must">Must</option>
                  <option value="nice">Nice</option>
                </select>
              </div>
              <div>
                <label htmlFor="act-date" className="auth-label">Date</label>
                <input
                  id="act-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="auth-input"
                />
              </div>
              <div>
                <label htmlFor="act-budget" className="auth-label">Budget (€)</label>
                <input
                  id="act-budget"
                  type="number"
                  min="0"
                  step="1"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="auth-input"
                  placeholder="0"
                />
              </div>
            </div>

            {error ? (
              <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-mist/70 hover:text-white"
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Add activity'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
