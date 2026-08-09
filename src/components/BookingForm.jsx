import { useState } from 'react'
import { api } from '../utils/api'
import { Icon } from './Icon'

// Add or edit a manual hotel/car/other booking. Pass `booking` to edit an
// existing one (pre-fills the form and PUTs instead of POSTs); omit it to
// create. `onSaved` fires with the created/updated booking either way.
const TYPES = [
  { value: 'hotel', label: 'Hotel', icon: 'bed' },
  { value: 'car', label: 'Car rental', icon: 'car' },
  { value: 'other', label: 'Other', icon: 'flag' },
]

const HTTP_URL_RE = /^https?:\/\//i

// datetime-local wants "YYYY-MM-DDTHH:mm"; stored values may carry seconds or
// a zone, so trim to the minute for the input to populate correctly.
function toLocalInput(v) {
  if (!v) return ''
  return String(v).slice(0, 16)
}

export default function BookingForm({ tripId, booking, onSaved, onCancel }) {
  const isEdit = !!booking
  const [type, setType] = useState(booking?.type || 'hotel')
  const [name, setName] = useState(booking?.name || '')
  const [location, setLocation] = useState(booking?.location || '')
  const [startDatetime, setStartDatetime] = useState(toLocalInput(booking?.startDatetime))
  const [endDatetime, setEndDatetime] = useState(toLocalInput(booking?.endDatetime))
  const [confirmation, setConfirmation] = useState(booking?.confirmation || '')
  const [cost, setCost] = useState(booking?.cost != null ? String(booking.cost) : '')
  const [referenceLink, setReferenceLink] = useState(booking?.referenceLink || '')
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
    const payload = {
      type,
      name,
      location: location || undefined,
      startDatetime,
      endDatetime,
      confirmation: confirmation || undefined,
      cost: cost ? Number(cost) : undefined,
      referenceLink: link || undefined,
    }
    try {
      const res = isEdit
        ? await api.put(`/trips/${tripId}/bookings/${booking.bookingId}`, payload)
        : await api.post(`/trips/${tripId}/bookings`, payload)
      onSaved?.(res.booking)
    } catch (err) {
      setError(err.message || `Could not ${isEdit ? 'save' : 'add'} this booking.`)
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
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add booking'}
          <Icon name={isEdit ? 'check' : 'plus'} />
        </button>
      </div>
    </form>
  )
}
