import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import WorldContour from '../components/WorldContour.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

export default function Trips() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [tripToDelete, setTripToDelete] = useState(null)
  const [signingOut, setSigningOut] = useState(false)

  const displayName = profile?.username ?? user?.user_metadata?.username ?? 'traveller'

  const loadTrips = async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    const { data, error: readError } = await supabase
      .from('trips')
      .select('id, name, user1_id, user2_id, invited_email, created_at')
      .order('created_at', { ascending: false })
    if (readError) {
      setError(readError.message)
    } else {
      setTrips(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTrips()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

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

      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-4">
        <div className="mb-4 flex items-center gap-3 text-[11px] font-medium tracking-[0.32em] text-gold">
          <span className="h-px w-8 bg-gold/60" />
          <span>YOUR TRIPS</span>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="headline text-3xl sm:text-4xl">Trips, together.</h1>
            <p className="mt-2 text-mist/70">
              Plan a journey and invite someone to shape it with you.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            Create trip
          </button>
        </div>

        <div className="mt-10">
          {loading ? (
            <p className="text-sm text-mist/60">Loading your trips…</p>
          ) : error ? (
            <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : trips.length === 0 ? (
            <div className="rounded-2xl border border-navy-line bg-navy-soft/40 px-6 py-10 text-center">
              <p className="text-mist/70">No trips yet.</p>
              <p className="mt-1 text-sm text-mist/50">
                Create your first one and invite a travel partner.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  isOwner={trip.user1_id === user?.id}
                  onOpen={() => navigate(`/trips/${trip.id}`)}
                  onDelete={() => setTripToDelete(trip)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {showModal ? (
          <CreateTripModal
            onClose={() => setShowModal(false)}
            onCreated={(trip) => {
              setTrips((prev) => [trip, ...prev])
              setShowModal(false)
              navigate(`/trips/${trip.id}`)
            }}
            userId={user?.id}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {tripToDelete ? (
          <DeleteTripModal
            trip={tripToDelete}
            onClose={() => setTripToDelete(null)}
            onDeleted={(id) => {
              setTrips((prev) => prev.filter((t) => t.id !== id))
              setTripToDelete(null)
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

function TripCard({ trip, isOwner, onOpen, onDelete }) {
  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-navy-line bg-navy-soft/50 shadow-soft backdrop-blur-sm transition-colors hover:border-gold/50 hover:bg-gold/5">
      <button
        type="button"
        onClick={onDelete}
        className="absolute right-3 top-3 rounded-full border border-navy-line bg-navy-deep/70 px-2 py-1 text-[11px] text-mist/60 opacity-0 transition-all hover:border-red-400/50 hover:text-red-200 focus:opacity-100 group-hover:opacity-100"
        aria-label={`Delete ${trip.name}`}
      >
        ✕
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="flex h-full flex-col rounded-2xl p-6 text-left"
      >
        <div className="text-[11px] tracking-[0.32em] text-gold">
          {isOwner ? 'YOU HOST · SHARED' : 'SHARED'}
        </div>
        <div className="mt-3 font-display text-2xl text-white">{trip.name}</div>
        <div className="mt-2 text-sm text-mist/60">
          {trip.invited_email ? (
            <>Invited: <span className="text-mist/80">{trip.invited_email}</span></>
          ) : trip.user2_id ? (
            'Two travellers'
          ) : (
            'Invite a partner to plan together'
          )}
        </div>
        <div className="mt-6 text-xs text-mist/50 transition-colors group-hover:text-gold">
          Open trip map →
        </div>
      </button>
    </div>
  )
}

function DeleteTripModal({ trip, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    const { error: delError } = await supabase.from('trips').delete().eq('id', trip.id)
    if (delError) {
      setError(delError.message)
      setDeleting(false)
      return
    }
    onDeleted(trip.id)
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
        className="w-full max-w-md rounded-2xl border border-red-400/30 bg-navy-soft/95 p-6 shadow-[0_0_80px_-20px_rgba(248,113,113,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[11px] tracking-[0.32em] text-red-200">DELETE TRIP</div>
        <h2 className="mt-2 font-display text-2xl text-white">
          Delete “{trip.name}”?
        </h2>
        <p className="mt-3 text-sm text-mist/70">
          This removes the trip and every country and activity linked to it.
          Your travel partner will lose access too. This can’t be undone.
        </p>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-mist/70 hover:text-white"
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center rounded-full bg-red-500/90 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete trip'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function CreateTripModal({ onClose, onCreated, userId }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName) {
      setError('Give your trip a name.')
      return
    }
    if (!userId) {
      setError('You must be signed in.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: trimmedName,
        user1_id: userId,
        invited_email: trimmedEmail || null,
      }
      const { data, error: insertError } = await supabase
        .from('trips')
        .insert(payload)
        .select('id, name, user1_id, user2_id, invited_email, created_at')
        .single()
      if (insertError) throw insertError
      onCreated(data)
    } catch (err) {
      setError(err.message ?? 'Could not create trip.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      key="modal"
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
        className="w-full max-w-md rounded-2xl border border-teal/20 bg-navy-soft/90 p-6 shadow-[0_0_80px_-20px_rgba(20,184,166,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="text-[11px] tracking-[0.32em] text-teal-soft">NEW TRIP</div>
            <h2 className="mt-2 font-display text-2xl text-white">Create a trip</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-navy-line px-3 py-1 text-xs text-mist/70 hover:border-teal/40 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="trip-name" className="auth-label">
              Trip name
            </label>
            <input
              id="trip-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              placeholder="e.g. Summer in Japan"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="trip-email" className="auth-label">
              Invite friend (email)
            </label>
            <input
              id="trip-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="partner@example.com"
            />
            <p className="mt-1.5 text-xs text-mist/50">
              Optional — you can invite someone later.
            </p>
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
              {saving ? 'Creating…' : 'Create trip'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
