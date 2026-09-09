import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import WorldContour from '../components/WorldContour.jsx'
import TripTabs from '../components/TripTabs.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

const CURATED = [
  {
    key: 'flights',
    label: 'Flights',
    icon: '✈️',
    accent: 'teal',
    items: [
      { title: 'Skyscanner', url: 'https://skyscanner.be', desc: 'Compare flights across every airline' },
      { title: 'Google Flights', url: 'https://flights.google.com', desc: 'Fast search + fare tracking' },
      { title: 'Kiwi.com', url: 'https://kiwi.com', desc: 'Multi-city + hidden connections' },
    ],
  },
  {
    key: 'accommodation',
    label: 'Accommodation',
    icon: '🏠',
    accent: 'gold',
    items: [
      { title: 'Booking.com', url: 'https://booking.com', desc: 'Hotels, apartments, guesthouses' },
      { title: 'Airbnb', url: 'https://airbnb.com', desc: 'Local stays and unique places' },
      { title: 'Hostelworld', url: 'https://hostelworld.com', desc: 'Budget hostels worldwide' },
    ],
  },
  {
    key: 'transport',
    label: 'Transport',
    icon: '🚌',
    accent: 'teal',
    items: [
      { title: 'Rome2rio', url: 'https://rome2rio.com', desc: 'A→B by any mode of transport' },
      { title: 'Omio', url: 'https://omio.com', desc: 'Trains, buses, ferries in Europe' },
    ],
  },
  {
    key: 'money',
    label: 'Money',
    icon: '💳',
    accent: 'gold',
    items: [
      { title: 'Wise', url: 'https://wise.com', desc: 'Cheap FX + multi-currency account' },
      { title: 'Revolut', url: 'https://revolut.com', desc: 'Travel card + budgeting' },
    ],
  },
  {
    key: 'activities',
    label: 'Activities',
    icon: '🎭',
    accent: 'teal',
    items: [
      { title: 'GetYourGuide', url: 'https://getyourguide.com', desc: 'Tours & experiences' },
      { title: 'Viator', url: 'https://viator.com', desc: 'Curated activities worldwide' },
    ],
  },
  {
    key: 'practical',
    label: 'Practical',
    icon: '🛠️',
    accent: 'gold',
    items: [
      { title: 'Airalo', url: 'https://airalo.com', desc: 'eSIM data plans, no roaming' },
      { title: 'TravelSpend', url: 'https://travelspend.app', desc: 'Track your travel budget on the go' },
    ],
  },
]

const CUSTOM_CATEGORIES = [
  { value: 'flights', label: 'Flights', icon: '✈️' },
  { value: 'accommodation', label: 'Accommodation', icon: '🏠' },
  { value: 'transport', label: 'Transport', icon: '🚌' },
  { value: 'money', label: 'Money', icon: '💳' },
  { value: 'activities', label: 'Activities', icon: '🎭' },
  { value: 'practical', label: 'Practical', icon: '🛠️' },
  { value: 'other', label: 'Other', icon: '🔗' },
]

export default function Resources() {
  const { tripId } = useParams()
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [customLinks, setCustomLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [signingOut, setSigningOut] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

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

      const { data: linkRows, error: linkErr } = await supabase
        .from('trip_links')
        .select('id, title, url, category, added_by, created_at')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })
      if (linkErr) throw linkErr
      setCustomLinks(linkRows ?? [])
    } catch (err) {
      setError(err.message ?? 'Could not load resources.')
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

  async function handleDeleteLink(id) {
    const snapshot = customLinks
    setCustomLinks((prev) => prev.filter((l) => l.id !== id))
    const { error: delErr } = await supabase.from('trip_links').delete().eq('id', id)
    if (delErr) {
      setCustomLinks(snapshot)
      setError(delErr.message)
    }
  }

  const customByCategory = useMemo(() => {
    const map = {}
    for (const l of customLinks) {
      const cat = l.category ?? 'other'
      if (!map[cat]) map[cat] = []
      map[cat].push(l)
    }
    return map
  }, [customLinks])

  return (
    <main className="relative min-h-screen bg-cloud">
      <div className="pointer-events-none absolute inset-0 z-0">
        <WorldContour className="h-full w-full" opacity={0.04} />
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
        <div className="mb-4 flex items-center gap-3 text-[11px] font-medium tracking-[0.32em] text-sky">
          <span className="h-px w-8 bg-teal/60" />
          <span>RESOURCES</span>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="headline text-3xl sm:text-4xl">
              {trip?.name ? <>{trip.name}<span className="text-sky-deep">.</span></> : 'Travel resources.'}
            </h1>
            <p className="mt-2 text-mist/70">
              Every tool worth bookmarking — plus the ones you find along the way.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="btn-primary"
          >
            + Add link
          </button>
        </div>

        <div className="mt-6 flex justify-center">
          <TripTabs tripId={tripId} />
        </div>

        {error ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {CURATED.map((cat) => (
            <CategoryCard
              key={cat.key}
              category={cat}
              custom={customByCategory[cat.key] ?? []}
              onDelete={handleDeleteLink}
              currentUserId={user?.id}
            />
          ))}
        </div>

        {(customByCategory.other ?? []).length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <CategoryCard
              category={{ key: 'other', label: 'Other', icon: '🔗', accent: 'teal', items: [] }}
              custom={customByCategory.other ?? []}
              onDelete={handleDeleteLink}
              currentUserId={user?.id}
            />
          </div>
        ) : null}

        {loading ? (
          <p className="mt-6 text-sm text-mist/60">Loading custom links…</p>
        ) : null}
      </section>

      <AnimatePresence>
        {showAdd ? (
          <AddLinkModal
            tripId={tripId}
            userId={user?.id}
            onClose={() => setShowAdd(false)}
            onCreated={(link) => {
              setCustomLinks((prev) => [link, ...prev])
              setShowAdd(false)
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
    isActive ? 'text-ink' : 'text-mist/70 hover:text-ink',
  ].join(' ')
}

function CategoryCard({ category, custom, onDelete, currentUserId }) {
  const accentBorder = category.accent === 'gold' ? 'border-gold/25' : 'border-teal/25'
  const accentLabel = category.accent === 'gold' ? 'text-gold' : 'text-sky'

  return (
    <div className={['rounded-2xl border bg-white p-5', accentBorder].join(' ')}>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl leading-none">{category.icon}</span>
        <div>
          <div className={['text-[11px] tracking-[0.32em]', accentLabel].join(' ')}>
            {category.label.toUpperCase()}
          </div>
          <h3 className="font-display text-lg text-ink">{category.label}</h3>
        </div>
      </div>
      <ul className="space-y-2">
        {category.items.map((item) => (
          <LinkRow key={item.url} item={item} />
        ))}
        {custom.map((l) => (
          <LinkRow
            key={l.id}
            item={{ title: l.title, url: l.url, desc: 'Added by trip member' }}
            onDelete={l.added_by === currentUserId ? () => onDelete(l.id) : null}
            custom
          />
        ))}
      </ul>
    </div>
  )
}

function LinkRow({ item, onDelete, custom }) {
  return (
    <li>
      <div className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-cloud px-3 py-2.5 transition-colors hover:border-sky/40">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1"
        >
          <div className="flex items-center gap-2">
            <span className="truncate text-sm text-ink group-hover:text-sky">
              {item.title}
            </span>
            {custom ? (
              <span className="rounded-full border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-[9px] tracking-widest text-gold">
                CUSTOM
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 text-xs text-mist/60">{item.desc}</div>
        </a>
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-mist/60 opacity-0 transition-all hover:border-red-400/40 hover:text-red-700 focus:opacity-100 group-hover:opacity-100"
            aria-label="Delete link"
          >
            ✕
          </button>
        ) : null}
      </div>
    </li>
  )
}

function AddLinkModal({ tripId, userId, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('other')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    const cleanTitle = title.trim()
    let cleanUrl = url.trim()
    if (!cleanTitle || !cleanUrl) {
      setError('Give it a title and a URL.')
      return
    }
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`
    }
    setSaving(true)
    setError(null)
    try {
      const { data, error: insErr } = await supabase
        .from('trip_links')
        .insert({
          trip_id: tripId,
          title: cleanTitle,
          url: cleanUrl,
          category,
          added_by: userId,
        })
        .select('id, title, url, category, added_by, created_at')
        .single()
      if (insErr) throw insErr
      onCreated(data)
    } catch (err) {
      setError(err.message ?? 'Could not save link.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="w-full max-w-md rounded-2xl border border-sky/20 bg-white p-6 shadow-[0_0_80px_-20px_rgba(20,184,166,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="text-[11px] tracking-[0.32em] text-sky">NEW LINK</div>
            <h2 className="mt-2 font-display text-2xl text-ink">Add a resource</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-mist/70 hover:border-sky/40 hover:text-ink"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="link-title" className="auth-label">Title</label>
            <input
              id="link-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="auth-input"
              placeholder="e.g. Local metro map"
              autoFocus
              required
            />
          </div>
          <div>
            <label htmlFor="link-url" className="auth-label">URL</label>
            <input
              id="link-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="auth-input"
              placeholder="https://…"
              required
            />
          </div>
          <div>
            <label htmlFor="link-cat" className="auth-label">Category</label>
            <select
              id="link-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="auth-input"
            >
              {CUSTOM_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-mist/70 hover:text-ink"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Add link'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
