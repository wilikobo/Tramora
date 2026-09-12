import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import WorldContour from '../components/WorldContour.jsx'
import TripTabs from '../components/TripTabs.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

const CATEGORIES = [
  {
    key: 'clothing',
    label: 'Kleding',
    icon: '👕',
    defaults: [
      'T-shirts (x5)',
      'Broeken (x2)',
      'Ondergoed (x7)',
      'Sokken (x7)',
      'Warme trui',
      'Regenjas',
      'Comfortabele wandelschoenen',
    ],
  },
  {
    key: 'electronics',
    label: 'Elektronica',
    icon: '🔌',
    defaults: [
      'Telefoon oplader',
      'Powerbank',
      'Camera',
      'Universele adapter',
      'Koptelefoon',
    ],
  },
  {
    key: 'health',
    label: 'Medicatie & Gezondheid',
    icon: '💊',
    defaults: [
      'Pijnstillers',
      'Maagpillen',
      'Zonnebrandcrème',
      'Muggenspray',
      'Pleisters',
    ],
  },
  {
    key: 'toiletries',
    label: 'Toiletries',
    icon: '🧴',
    defaults: [
      'Tandenborstel',
      'Shampoo (reisformaat)',
      'Deodorant',
      'Scheermesje',
    ],
  },
  {
    key: 'documents',
    label: 'Documenten',
    icon: '📄',
    defaults: [
      'Paspoort',
      'Verzekeringsdocument',
      'Vluchtickets (print)',
      'Hotelvouchers',
    ],
  },
]

export default function Packing() {
  const { tripId } = useParams()
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [signingOut, setSigningOut] = useState(false)
  const [addingCategory, setAddingCategory] = useState(null)

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

      const { data: itemRows, error: itemErr } = await supabase
        .from('packing_items')
        .select('id, category, label, packed, added_by, created_at')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true })
      if (itemErr) throw itemErr

      let rows = itemRows ?? []
      if (rows.length === 0) {
        const seed = CATEGORIES.flatMap((cat) =>
          cat.defaults.map((label) => ({
            trip_id: tripId,
            category: cat.key,
            label,
            packed: false,
            added_by: user?.id ?? null,
          })),
        )
        const { data: inserted, error: seedErr } = await supabase
          .from('packing_items')
          .insert(seed)
          .select('id, category, label, packed, added_by, created_at')
        if (seedErr) throw seedErr
        rows = inserted ?? []
      }
      setItems(rows)
    } catch (err) {
      setError(err.message ?? 'Could not load packing list.')
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

  async function toggleItem(item) {
    const nextPacked = !item.packed
    const snapshot = items
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, packed: nextPacked } : i)),
    )
    const { error: updErr } = await supabase
      .from('packing_items')
      .update({ packed: nextPacked })
      .eq('id', item.id)
    if (updErr) {
      setItems(snapshot)
      setError(updErr.message)
    }
  }

  async function deleteItem(id) {
    const snapshot = items
    setItems((prev) => prev.filter((i) => i.id !== id))
    const { error: delErr } = await supabase.from('packing_items').delete().eq('id', id)
    if (delErr) {
      setItems(snapshot)
      setError(delErr.message)
    }
  }

  async function addItem(category, label) {
    const clean = label.trim()
    if (!clean) return
    const { data, error: insErr } = await supabase
      .from('packing_items')
      .insert({
        trip_id: tripId,
        category,
        label: clean,
        packed: false,
        added_by: user?.id ?? null,
      })
      .select('id, category, label, packed, added_by, created_at')
      .single()
    if (insErr) {
      setError(insErr.message)
      return
    }
    setItems((prev) => [...prev, data])
  }

  const grouped = useMemo(() => {
    const map = {}
    for (const cat of CATEGORIES) map[cat.key] = []
    for (const i of items) {
      if (!map[i.category]) map[i.category] = []
      map[i.category].push(i)
    }
    return map
  }, [items])

  const total = items.length
  const packed = items.filter((i) => i.packed).length
  const pct = total ? Math.round((packed / total) * 100) : 0

  return (
    <main className="relative min-h-screen bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
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
        <div className="mb-4 flex items-center gap-3 text-[11px] font-medium tracking-[0.32em] text-sky">
          <span className="h-px w-8 bg-sky/60" />
          <span>PACKING</span>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="headline text-3xl sm:text-4xl">
              {trip?.name ? <>{trip.name}<span className="text-sky-deep">.</span></> : 'Packing list.'}
            </h1>
            <p className="mt-2 text-mist/70">
              Vink af terwijl je inpakt — niets vergeten.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <TripTabs tripId={tripId} />
        </div>

        <div className="mt-8 rounded-2xl border border-sky/25 bg-sky/5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-sky-deep">
              {packed}/{total} ingepakt
            </span>
            <span className="text-xs tracking-widest text-sky">{pct}%</span>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-sky/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {error ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-6 text-sm text-mist/60">Loading packing list…</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.key}
                category={cat}
                items={grouped[cat.key] ?? []}
                onToggle={toggleItem}
                onDelete={deleteItem}
                onAdd={(label) => addItem(cat.key, label)}
                isAdding={addingCategory === cat.key}
                setIsAdding={(v) => setAddingCategory(v ? cat.key : null)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function navClass({ isActive }) {
  return [
    'text-sm tracking-wide transition-colors',
    isActive ? 'text-ink' : 'text-mist/70 hover:text-ink',
  ].join(' ')
}

function CategoryCard({ category, items, onToggle, onDelete, onAdd, isAdding, setIsAdding }) {
  const [draft, setDraft] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!draft.trim()) return
    await onAdd(draft)
    setDraft('')
    setIsAdding(false)
  }

  return (
    <div className="rounded-2xl border border-sky/25 bg-white p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl leading-none">{category.icon}</span>
        <div>
          <div className="text-[11px] tracking-[0.32em] text-sky">
            {category.label.toUpperCase()}
          </div>
          <h3 className="font-display text-lg text-ink">{category.label}</h3>
        </div>
      </div>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
            >
              <div
                className={[
                  'group flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                  item.packed
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-sky/40',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => onToggle(item)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <span
                    className={[
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                      item.packed
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 bg-white group-hover:border-sky/60',
                    ].join(' ')}
                  >
                    {item.packed ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path
                          fillRule="evenodd"
                          d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4L8.5 12l6.8-6.8a1 1 0 011.4 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : null}
                  </span>
                  <span
                    className={[
                      'text-sm transition-colors',
                      item.packed ? 'text-emerald-700 line-through' : 'text-ink',
                    ].join(' ')}
                  >
                    {item.label}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-mist/60 opacity-0 transition-all hover:border-red-400/40 hover:text-red-700 focus:opacity-100 group-hover:opacity-100"
                  aria-label="Delete item"
                >
                  ✕
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {isAdding ? (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nieuw item…"
            className="auth-input !py-2 text-sm"
          />
          <button type="submit" className="btn-primary !px-4 !py-2 text-xs">
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft('')
              setIsAdding(false)
            }}
            className="text-xs text-mist/70 hover:text-ink"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="mt-3 w-full rounded-xl border border-dashed border-sky/40 px-3 py-2 text-xs font-medium text-sky transition-colors hover:border-sky hover:bg-sky/5"
        >
          + Add item
        </button>
      )}
    </div>
  )
}
