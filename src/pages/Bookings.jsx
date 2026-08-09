import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../utils/api'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import { StaggerContainer, StaggerItem } from '../components/motion'
import TripTabs from '../components/TripTabs'
import BookingForm from '../components/BookingForm'
import './pages.scss'

const HTTP_URL_RE = /^https?:\/\//i
const BOOKING_ICONS = { hotel: 'bed', car: 'car', other: 'flag' }
const BOOKING_TYPE_LABEL = { hotel: 'Hotel', car: 'Car rental', other: 'Other' }
const BOOKING_LABELS = {
  hotel: ['Check-in', 'Check-out'],
  car: ['Pickup', 'Dropoff'],
  other: ['Start', 'End'],
}

function fmtDateTime(v) {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// The shared home for a trip's bookings — everyone sees all of them and can
// add, edit, or delete any (bookings are group logistics, not owned by
// whoever happened to enter them). The Itinerary shows these same bookings as
// read-only plan anchors; this is where they're actually managed.
export default function Bookings() {
  const { tripId } = useParams()
  const [trip, setTrip] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    setLoading(true)
    api
      .get(`/trips/${tripId}`)
      .then((res) => {
        setTrip(res.trip)
        setBookings(res.bookings || [])
      })
      .catch((e) => setLoadError(e.message || 'Could not load bookings.'))
      .finally(() => setLoading(false))
  }, [tripId])

  function handleAdded(booking) {
    setBookings((b) => [...b, booking])
    setShowAdd(false)
  }

  function handleUpdated(booking) {
    setBookings((b) => b.map((x) => (x.bookingId === booking.bookingId ? booking : x)))
    setEditingId(null)
  }

  async function handleDelete(bookingId) {
    const prev = bookings
    setBookings((b) => b.filter((x) => x.bookingId !== bookingId))
    if (editingId === bookingId) setEditingId(null)
    try {
      await api.delete(`/trips/${tripId}/bookings/${bookingId}`)
    } catch {
      setBookings(prev)
    }
  }

  const sorted = [...bookings].sort((a, b) => (a.startDatetime || '').localeCompare(b.startDatetime || ''))

  return (
    <AppShell>
      <div className="itin-head">
        <div>
          <div className="eyebrow plan-badge">
            <Icon name="bed" />
            Bookings
          </div>
          <h1 className="page-title" style={{ marginTop: 4 }}>{trip?.name || 'Loading…'}</h1>
        </div>
        <div className="itin-actions">
          <button
            className="btn small accent"
            type="button"
            onClick={() => {
              setEditingId(null)
              setShowAdd((s) => !s)
            }}
          >
            <Icon name="plus" />
            {showAdd ? 'Cancel' : 'Add booking'}
          </button>
        </div>
      </div>

      <TripTabs tripId={tripId} active="bookings" showToday />

      {loading && (
        <div className="panel glass" style={{ padding: 24 }}>
          <p className="eyebrow">Loading…</p>
        </div>
      )}

      {!loading && loadError && <div className="error-banner">{loadError}</div>}

      {!loading && !loadError && (
        <>
          {showAdd && (
            <div style={{ marginBottom: 16 }}>
              <BookingForm tripId={tripId} onSaved={handleAdded} onCancel={() => setShowAdd(false)} />
            </div>
          )}

          {sorted.length === 0 && !showAdd ? (
            <div className="panel glass empty-state">
              <Icon name="bed" />
              <p>No bookings yet — add a hotel, car, or anything else the group has locked in.</p>
            </div>
          ) : (
            <StaggerContainer>
              {sorted.map((b) => {
                const [startLabel, endLabel] = BOOKING_LABELS[b.type] || BOOKING_LABELS.other
                if (editingId === b.bookingId) {
                  return (
                    <StaggerItem key={b.bookingId}>
                      <div style={{ marginBottom: 16 }}>
                        <BookingForm
                          tripId={tripId}
                          booking={b}
                          onSaved={handleUpdated}
                          onCancel={() => setEditingId(null)}
                        />
                      </div>
                    </StaggerItem>
                  )
                }
                return (
                  <StaggerItem key={b.bookingId}>
                    <div className="booking-row panel glass">
                      <span className="icon-badge">
                        <Icon name={BOOKING_ICONS[b.type] || 'flag'} />
                      </span>
                      <div className="booking-info">
                        <div className="booking-name">
                          {b.name}
                          <span className="booking-type">{BOOKING_TYPE_LABEL[b.type] || 'Other'}</span>
                          {b.cost != null && <span className="event-cost mono">${b.cost}</span>}
                        </div>
                        <div className="note">
                          {startLabel} {fmtDateTime(b.startDatetime)} · {endLabel} {fmtDateTime(b.endDatetime)}
                        </div>
                        {b.location && (
                          <div className="note">
                            <Icon name="pin" /> {b.location}
                          </div>
                        )}
                        {(b.confirmation || (b.referenceLink && HTTP_URL_RE.test(b.referenceLink))) && (
                          <div className="note">
                            {b.confirmation && <>conf #{b.confirmation}</>}
                            {b.confirmation && b.referenceLink && HTTP_URL_RE.test(b.referenceLink) && ' · '}
                            {b.referenceLink && HTTP_URL_RE.test(b.referenceLink) && (
                              <a href={b.referenceLink} target="_blank" rel="noopener noreferrer" className="ref-link">
                                <Icon name="link" />
                                reference
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="booking-actions">
                        <button
                          type="button"
                          className="btn small ghost"
                          onClick={() => {
                            setShowAdd(false)
                            setEditingId(b.bookingId)
                          }}
                        >
                          <Icon name="sliders" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn small ghost"
                          aria-label={`Delete booking: ${b.name}`}
                          onClick={() => handleDelete(b.bookingId)}
                        >
                          <Icon name="x" />
                        </button>
                      </div>
                    </div>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          )}
        </>
      )}
    </AppShell>
  )
}
