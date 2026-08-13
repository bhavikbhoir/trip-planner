import { useState } from 'react'
import { api } from '../utils/api'
import { Icon } from './Icon'
import PlaceAutocomplete from './PlaceAutocomplete'

const TRIP_TYPES = [
  { value: 'business', label: 'Business' },
  { value: 'leisure', label: 'Leisure' },
  { value: 'friends', label: 'Friends' },
  { value: 'family', label: 'Family' },
  { value: 'date', label: 'Date' },
]

// Owner-only (enforced server-side too) — editing the trip's name,
// destination, dates, or type. Separate from CreateTrip's form rather than
// a shared component: creation also handles owner-membership setup and a
// post-create redirect that don't apply here.
export default function EditTripForm({ tripId, trip, onSaved, onCancel }) {
  const [name, setName] = useState(trip.name || '')
  const [destination, setDestination] = useState(trip.destination || '')
  const [startDate, setStartDate] = useState(trip.startDate || '')
  const [endDate, setEndDate] = useState(trip.endDate || '')
  const [tripType, setTripType] = useState(trip.tripType || '')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const res = await api.put(`/trips/${tripId}`, {
        name,
        destination,
        startDate,
        endDate,
        tripType: tripType || undefined,
      })
      onSaved?.(res.trip)
    } catch (err) {
      setError(err.message || 'Could not save these changes.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="panel glass" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}
      <div className="field">
        <label htmlFor="editTripName">Trip name</label>
        <div className="field-input">
          <Icon name="flag" />
          <input id="editTripName" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="editTripDestination">Destination</label>
        <PlaceAutocomplete id="editTripDestination" required value={destination} onChange={setDestination} />
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="editTripStart">Start date</label>
          <div className="field-input">
            <Icon name="calendar" />
            <input
              id="editTripStart"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="editTripEnd">End date</label>
          <div className="field-input">
            <Icon name="calendar" />
            <input id="editTripEnd" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="field">
        <label>What kind of trip is this?</label>
        <div className="chip-grid">
          {TRIP_TYPES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className="chip"
              aria-pressed={tripType === opt.value}
              onClick={() => setTripType((t) => (t === opt.value ? '' : opt.value))}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="q-actions">
        {onCancel && (
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn accent" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
          <Icon name="check" />
        </button>
      </div>
    </form>
  )
}
