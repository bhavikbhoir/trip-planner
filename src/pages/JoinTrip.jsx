import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import './pages.scss'

export default function JoinTrip() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [memberCount, setMemberCount] = useState(0)
  const [error, setError] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    api
      .get(`/trips/${tripId}`)
      .then((res) => {
        setTrip(res.trip)
        setMemberCount(res.members?.length || 0)
      })
      .catch((err) => setError(err.message || 'This invite link is invalid or has expired.'))
  }, [tripId])

  async function handleJoin() {
    setIsJoining(true)
    setError('')
    try {
      await api.post(`/trips/${tripId}/join`)
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

        {!trip && !error && <p className="eyebrow">Loading invite…</p>}

        {trip && (
          <div className="panel glass invite-card">
            <div className="eyebrow">
              invite · /trip/{tripId}/join
            </div>
            <p className="q-sub" style={{ marginTop: 12 }}>
              You're invited to
            </p>
            <div className="trip-dest">{trip.name}</div>
            <p className="invite-by">
              {trip.destination} · {memberCount} traveler{memberCount === 1 ? '' : 's'} so far
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
