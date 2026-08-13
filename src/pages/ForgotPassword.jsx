import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import AuthPitch from '../components/AuthPitch'
import { Icon } from '../components/Icon'
import './pages.scss'

export default function ForgotPassword() {
  const { requestPasswordReset, confirmPasswordReset } = useAuth()
  const navigate = useNavigate()
  const [stage, setStage] = useState('request') // 'request' | 'confirm'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleRequest(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await requestPasswordReset(email)
      setStage('confirm')
    } catch (err) {
      setError(err.message || 'Could not send a reset code.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleConfirm(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await confirmPasswordReset(email, code, newPassword)
      setMessage('Your password has been reset. You can now sign in.')
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      setError(err.message || 'Could not reset your password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell minimal>
      <div className="auth-page">
        <AuthPitch />
        <div className="auth-shell">
          <p className="eyebrow" style={{ marginBottom: 14 }}>
            {stage === 'request' ? 'Reset your password' : 'Check your email'}
          </p>

          {stage === 'request' ? (
            <form className="panel glass auth-panel" onSubmit={handleRequest}>
              {error && <div className="error-banner">{error}</div>}
              <p className="q-sub">
                Enter the email on your account and we&apos;ll send you a code to reset your password.
              </p>
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
              <button className="btn accent" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending…' : 'Send reset code'}
                <Icon name="plane" />
              </button>
              <p className="auth-switch">
                Remembered your password? <Link to="/login">Sign in</Link>
              </p>
            </form>
          ) : (
            <form className="panel glass auth-panel" onSubmit={handleConfirm}>
              {error && <div className="error-banner">{error}</div>}
              {message && <p className="q-sub">{message}</p>}
              <p className="q-sub">We sent a reset code to {email}.</p>
              <div className="field">
                <label htmlFor="code">Reset code</label>
                <div className="field-input">
                  <input id="code" type="text" required value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="newPassword">New password</label>
                <div className="field-input">
                  <input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <button className="btn accent" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Resetting…' : 'Reset password'}
                <Icon name="check" />
              </button>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  )
}
