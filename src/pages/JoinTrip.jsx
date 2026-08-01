import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import './pages.scss'

export default function JoinTrip() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    api
      .get(`/trips/${tripId}/preview`)
      .then((res) => setPreview(res))
      .catch((err) => setError(err.message || 'This invite link is invalid or has expired.'))
  }, [tripId])

  async function handleJoin() {
    setIsJoining(true)
    setError('')
    try {
      await api.post(`/trips/${tripId}/join`, { displayName: user?.displayName })
      navigate(`/trip/${tripId}/preferences`, { replace: true })
    } catch (err) {
      setError(err.message || 'Could not join this trip.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <AppShell>
      <div className="auth-shell">
        {error && <div className="error-banner">{error}</div>}

        {!preview && !error && <p className="eyebrow">Loading invite…</p>}

        {preview && (
          <div className="panel glass invite-card">
            <div className="eyebrow">
              invite · /trip/{tripId}/join
            </div>
            <p className="q-sub" style={{ marginTop: 12 }}>
              You're invited to
            </p>
            <div className="trip-dest">{preview.name}</div>
            <p className="invite-by">
              {preview.destination} · {preview.memberCount} traveler{preview.memberCount === 1 ? '' : 's'} so far
            </p>
            <button className="btn accent" onClick={handleJoin} disabled={isJoining}>
              {isJoining ? 'Joining…' : 'Join trip'}
              <Icon name="link" />
            </button>
            <div className="invite-note">
              <Icon name="link" />
              The link is the invite — no separate code needed
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
