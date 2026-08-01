import { useState } from 'react'
import { api } from '../utils/api'
import { Icon } from './Icon'

// Add a manual hotel/car/other booking to a trip. Used from the Itinerary
// page. Renders as a glass panel form; pass onCreated to react to a
// successful POST.
const TYPES = [
  { value: 'hotel', label: 'Hotel', icon: 'bed' },
  { value: 'car', label: 'Car rental', icon: 'car' },
  { value: 'other', label: 'Other', icon: 'flag' },
]

const HTTP_URL_RE = /^https?:\/\//i

export default function BookingForm({ tripId, onCreated, onCancel }) {
  const [type, setType] = useState('hotel')
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [startDatetime, setStartDatetime] = useState('')
  const [endDatetime, setEndDatetime] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [cost, setCost] = useState('')
  const [referenceLink, setReferenceLink] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const link = referenceLink.trim()
    if (link && !HTTP_URL_RE.test(link)) {
      setError('Reference link must start with http:// or https://')
      return
    }
    setIsSubmitting(true)
    try {
      const booking = await api.post(`/trips/${tripId}/bookings`, {
        type,
        name,
        location: location || undefined,
        startDatetime,
        endDatetime,
        confirmation: confirmation || undefined,
        cost: cost ? Number(cost) : undefined,
        referenceLink: referenceLink.trim() || undefined,
      })
      onCreated?.(booking.booking)
    } catch (err) {
      setError(err.message || 'Could not add this booking.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const startLabel = type === 'hotel' ? 'Check-in' : type === 'car' ? 'Pickup' : 'Start'
  const endLabel = type === 'hotel' ? 'Check-out' : type === 'car' ? 'Dropoff' : 'End'

  return (
    <form className="panel glass" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label>Type</label>
        <div className="chip-grid">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className="chip"
              aria-pressed={type === t.value}
              onClick={() => setType(t.value)}
            >
              <Icon name={t.icon} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="bookingName">Name</label>
        <div className="field-input">
          <Icon name={TYPES.find((t) => t.value === type)?.icon || 'flag'} />
          <input
            id="bookingName"
            required
            placeholder={type === 'hotel' ? 'e.g. Ubud Jungle Villas' : type === 'car' ? 'e.g. Bali Go Rentals' : ''}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="bookingLocation">Location</label>
        <div className="field-input">
          <Icon name="pin" />
          <input id="bookingLocation" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label htmlFor="bookingStart">{startLabel}</label>
          <div className="field-input">
            <Icon name="calendar" />
            <input
              id="bookingStart"
              type="datetime-local"
              required
              value={startDatetime}
              onChange={(e) => setStartDatetime(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="bookingEnd">{endLabel}</label>
          <div className="field-input">
            <Icon name="calendar" />
            <input
              id="bookingEnd"
              type="datetime-local"
              required
              value={endDatetime}
              onChange={(e) => setEndDatetime(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="row2">
        <div className="field">
          <label htmlFor="bookingConfirmation">Confirmation #</label>
          <div className="field-input">
            <Icon name="check" />
            <input id="bookingConfirmation" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="bookingCost">Cost</label>
          <div className="field-input">
            <Icon name="wallet" />
            <input id="bookingCost" type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="bookingLink">Reference link</label>
        <div className="field-input">
          <Icon name="link" />
          <input
            id="bookingLink"
            type="url"
            placeholder="Booking.com confirmation, PDF, etc."
            value={referenceLink}
            onChange={(e) => setReferenceLink(e.target.value)}
          />
        </div>
      </div>

      <div className="q-actions">
        {onCancel && (
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn accent" disabled={isSubmitting}>
          {isSubmitting ? 'Adding…' : 'Add booking'}
          <Icon name="plus" />
        </button>
      </div>
    </form>
  )
}
