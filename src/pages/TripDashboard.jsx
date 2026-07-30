import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { StaggerContainer, StaggerItem } from '../components/motion'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import './pages.scss'

export default function TripDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/trips')
      .then((res) => setTrips(res.trips))
      .catch((err) => setError(err.message || 'Could not load your trips.'))
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell
      actions={
        <button className="btn ghost small" onClick={handleLogout}>
          Sign out
        </button>
      }
    >
      <div className="page-head">
        <h1>Your trips</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {trips === null && !error && <p className="eyebrow">Loading your trips…</p>}

      {trips && trips.length === 0 && (
        <div className="panel glass empty-state">
          <p className="q-title">No trips yet</p>
          <p className="q-sub">
            Create your first trip and invite friends with a link — everything stays in that trip.
          </p>
          <Link className="btn accent" to="/trips/new">
            <Icon name="plus" />
            New trip
          </Link>
        </div>
      )}

      {trips && trips.length > 0 && (
        <StaggerContainer className="trip-grid">
          {trips.map((trip) => (
            <StaggerItem key={trip.tripId}>
              <Link className="trip-card" to={`/trip/${trip.tripId}/itinerary`}>
                <div className="trip-meta">
                  <Icon name="pin" />
                  {trip.destination}
                </div>
                <div className="trip-dest">{trip.name}</div>
                <div className="trip-meta">
                  <Icon name="calendar" />
                  <span className="mono">
                    {trip.startDate} – {trip.endDate}
                  </span>
                </div>
                <div className="trip-foot">
                  <span className="eyebrow">View itinerary →</span>
                  <span className={`status-pill ${trip.status === 'finalized' ? 'final' : 'planning'}`}>
                    <span className="dot" />
                    {trip.status === 'finalized' ? 'Finalized' : 'Planning'}
                  </span>
                </div>
              </Link>
            </StaggerItem>
          ))}
          <StaggerItem>
            <Link className="trip-new" to="/trips/new">
              <Icon name="plus" />
              <span>New trip</span>
            </Link>
          </StaggerItem>
        </StaggerContainer>
      )}
    </AppShell>
  )
}
