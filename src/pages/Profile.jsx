import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import WorldContour from '../components/WorldContour.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState(profile?.username ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setUsername(profile?.username ?? '')
  }, [profile?.username])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!user) return
    setError(null)
    setSuccess(false)
    const trimmed = username.trim()
    if (!trimmed) {
      setError('Username cannot be empty.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        user_id: user.id,
        username: trimmed,
      }
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'user_id' })
      if (upsertError) throw upsertError
      await refreshProfile()
      setSuccess(true)
    } catch (err) {
      setError(err.message ?? 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="relative min-h-screen bg-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <WorldContour className="h-full w-full" color="#2563EB" opacity={0.03} />
      </div>

      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-6 py-8">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src="/logo.png" width="40" height="40" alt="Wayra" className="rounded-full" />
          <span className="font-display text-lg text-ink">Wayra</span>
        </Link>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="btn-ghost"
        >
          ← Back
        </button>
      </header>

      <section className="relative z-10 mx-auto max-w-xl px-6 pb-24 pt-4">
        <div className="mb-4 flex items-center gap-3 text-[11px] font-medium tracking-[0.32em] text-gold">
          <span className="h-px w-8 bg-gold/60" />
          <span>PROFILE</span>
        </div>

        <h1 className="headline text-3xl sm:text-4xl">Edit your profile</h1>
        <p className="mt-3 text-mist/70">
          Update the name your travel partner will see across Wayra.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft backdrop-blur-sm"
        >
          <div>
            <label htmlFor="email" className="auth-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={user?.email ?? ''}
              readOnly
              className="auth-input opacity-70"
            />
          </div>

          <div>
            <label htmlFor="username" className="auth-label">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="auth-input"
              placeholder="e.g. wanderlust"
              autoComplete="off"
              required
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="rounded-lg border border-sky/30 bg-sky/10 px-3 py-2 text-sm text-sky">
              Saved. Your profile is up to date.
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Link to="/dashboard" className="text-sm text-mist/70 hover:text-ink">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
