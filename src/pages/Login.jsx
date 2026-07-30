import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import './pages.scss'

export default function Login() {
  const { login, enterDemo } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate(searchParams.get('next') || '/', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not sign in — check your email and password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDemo() {
    enterDemo()
    navigate('/', { replace: true })
  }

  return (
    <AppShell>
      <div className="auth-shell">
        <p className="eyebrow" style={{ marginBottom: 14 }}>
          Sign in to your trips
        </p>

        <form className="panel glass auth-panel" onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}
          <div className="field">
            <label htmlFor="email">Email</label>
            <div className="field-input">
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="field-input">
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button className="btn accent" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
            <Icon name="plane" />
          </button>
          <p className="auth-switch">
            No account? <Link to="/register">Create one</Link>
          </p>

          <div className="auth-divider">
            <span>or</span>
          </div>
          <button className="btn ghost" type="button" onClick={handleDemo}>
            <Icon name="sparkle" />
            Try the demo — no account needed
          </button>
        </form>
      </div>
    </AppShell>
  )
}
