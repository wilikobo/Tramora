import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setInfo(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const data = await signUp({ email, password, username })
      if (data.session) {
        navigate('/dashboard', { replace: true })
      } else {
        setInfo('Check your inbox to confirm your email, then sign in.')
      }
    } catch (err) {
      setError(err.message ?? 'Could not create your account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Begin the journey"
      subtitle="Create an account and invite your travel companion."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-sky hover:text-sky-deep">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="auth-label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            minLength={2}
            maxLength={32}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="auth-input"
            placeholder="wanderer"
          />
        </div>

        <div>
          <label className="auth-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="you@wayra.travel"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="auth-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="auth-label" htmlFor="confirm">
              Confirm
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="rounded-lg border border-forest/30 bg-forest/10 px-3 py-2 text-sm text-forest-deep">
            {info}
          </p>
        ) : null}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
