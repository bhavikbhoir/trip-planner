import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import PlaceAutocomplete from '../components/PlaceAutocomplete'
import './pages.scss'

export default function CreateTrip() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const res = await api.post('/trips', { name, destination, startDate, endDate, displayName: user?.displayName })
      navigate(`/trip/${res.trip.tripId}/preferences`, { replace: true })
    } catch (err) {
      setError(err.message || 'Could not create the trip.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell
      actions={
        <Link className="btn ghost small" to="/">
          <Icon name="compass" />
          Dashboard
        </Link>
      }
    >
      <div className="page-head">
        <h1>New trip</h1>
      </div>

      <form className="panel glass" style={{ maxWidth: 460 }} onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}
        <div className="field">
          <label htmlFor="name">Trip name</label>
          <div className="field-input">
            <Icon name="flag" />
            <input
              id="name"
              required
              placeholder="e.g. Bali w/ Crew"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="destination">Destination</label>
          <PlaceAutocomplete
            id="destination"
            required
            placeholder="e.g. Bali, Indonesia"
            value={destination}
            onChange={setDestination}
          />
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="start">Start date</label>
            <div className="field-input">
              <Icon name="calendar" />
              <input
                id="start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="end">End date</label>
            <div className="field-input">
              <Icon name="calendar" />
              <input id="end" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <button className="btn accent" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create trip'}
          <Icon name="plane" />
        </button>
      </form>
    </AppShell>
  )
}
