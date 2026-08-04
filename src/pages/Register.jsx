import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import { safeNextPath } from '../utils/safeNext'
import './pages.scss'

export default function Register() {
  const { register, confirmRegistration, login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [stage, setStage] = useState('signup') // 'signup' | 'confirm'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSignUp(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await register(email, password, name)
      setStage('confirm')
    } catch (err) {
      setError(err.message || 'Could not create your account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleConfirm(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await confirmRegistration(email, code)
      await login(email, password)
      navigate(safeNextPath(searchParams.get('next')) || '/', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not confirm your account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell>
      <div className="auth-shell">
        <p className="eyebrow" style={{ marginBottom: 14 }}>
          {stage === 'signup' ? 'Create your account' : 'Check your email'}
        </p>

        {stage === 'signup' ? (
          <form className="panel glass auth-panel" onSubmit={handleSignUp}>
            {error && <div className="error-banner">{error}</div>}
            <div className="field">
              <label htmlFor="name">Name</label>
              <div className="field-input">
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="What should we call you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
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
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <button className="btn accent" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create account'}
              <Icon name="plane" />
            </button>
            <p className="auth-switch">
              Already have an account?{' '}
              <Link to={safeNextPath(searchParams.get('next')) ? `/login?next=${encodeURIComponent(safeNextPath(searchParams.get('next')))}` : '/login'}>
                Sign in
              </Link>
            </p>
          </form>
        ) : (
          <form className="panel glass auth-panel" onSubmit={handleConfirm}>
            {error && <div className="error-banner">{error}</div>}
            <p className="q-sub">We sent a verification code to {email}.</p>
            <div className="field">
              <label htmlFor="code">Verification code</label>
              <div className="field-input">
                <input id="code" type="text" required value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
            </div>
            <button className="btn accent" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Confirming…' : 'Confirm & sign in'}
              <Icon name="check" />
            </button>
          </form>
        )}
      </div>
    </AppShell>
  )
}
