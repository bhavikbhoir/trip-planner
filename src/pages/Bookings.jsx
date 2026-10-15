import { Fragment, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
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

const EXTRACT_ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const EXTRACT_MAX_BYTES = 10 * 1024 * 1024

function fmtDateTime(v) {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.readAsDataURL(file)
  })
}

// The extract endpoint returns loose date/time pieces (whatever it could
// actually read), not a ready-made datetime-local string — combine them
// here, defaulting a missing time to noon so the field is never left in a
// half-valid state the form can't render. All of this is a starting point
// for the user to review, never saved as-is.
function buildPrefillFromExtracted(ex) {
  const combine = (date, time) => (date ? `${date}T${time || '12:00'}` : '')
  return {
    type: ['hotel', 'car', 'other'].includes(ex.type) ? ex.type : 'hotel',
    name: ex.name || '',
    location: ex.location || '',
    startDatetime: combine(ex.startDate, ex.startTime),
    endDatetime: combine(ex.endDate, ex.endTime),
    confirmation: ex.confirmation || '',
    cost: ex.cost != null ? String(ex.cost) : '',
    breakfastIncluded: !!ex.breakfastIncluded,
  }
}

// The shared home for a trip's bookings — everyone sees all of them and can
// add, edit, or delete any (bookings are group logistics, not owned by
// whoever happened to enter them). The Itinerary shows these same bookings as
// read-only plan anchors; this is where they're actually managed.
export default function Bookings() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const [trip, setTrip] = useState(null)
  const [members, setMembers] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [addMethod, setAddMethod] = useState(null) // null | 'manual' | 'extract'
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [extractedPrefill, setExtractedPrefill] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const [convertingId, setConvertingId] = useState(null)
  const [convertPaidBy, setConvertPaidBy] = useState('')
  const [convertSplit, setConvertSplit] = useState([])
  const [convertError, setConvertError] = useState('')
  const [isConverting, setIsConverting] = useState(false)

  function memberLabel(userId) {
    if (userId === user?.userId) return 'You'
    return members.find((m) => m.userId === userId)?.displayName || 'A traveler'
  }

  useEffect(() => {
    setLoading(true)
    api
      .get(`/trips/${tripId}`)
      .then((res) => {
        setTrip(res.trip)
        setMembers(res.members || [])
        setBookings(res.bookings || [])
      })
      .catch((e) => setLoadError(e.message || 'Could not load bookings.'))
      .finally(() => setLoading(false))
  }, [tripId])

  function handleAdded(booking) {
    setBookings((b) => [...b, booking])
    closeAddFlow()
  }

  function closeAddFlow() {
    setShowAdd(false)
    setAddMethod(null)
    setExtractedPrefill(null)
    setExtractError('')
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!EXTRACT_ACCEPT_TYPES.includes(file.type)) {
      setExtractError('Please upload a JPEG, PNG, WebP, or HEIC image.')
      return
    }
    if (file.size > EXTRACT_MAX_BYTES) {
      setExtractError('Image too large — maximum 10 MB.')
      return
    }
    setExtractError('')
    setExtracting(true)
    try {
      const content = await fileToBase64(file)
      const res = await api.post(`/trips/${tripId}/bookings/extract`, { content, mediaType: file.type })
      setExtractedPrefill(buildPrefillFromExtracted(res.extracted || {}))
    } catch (err) {
      setExtractError(err.message || 'Could not read that image — try again, or add it manually.')
    } finally {
      setExtracting(false)
    }
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

  function startConvert(booking) {
    setEditingId(null)
    setConvertingId(booking.bookingId)
    setConvertPaidBy(user?.userId || members[0]?.userId || '')
    setConvertSplit(members.map((m) => m.userId))
    setConvertError('')
  }

  function toggleConvertSplit(userId) {
    setConvertSplit((s) => (s.includes(userId) ? s.filter((id) => id !== userId) : [...s, userId]))
  }

  async function handleConvert(bookingId) {
    setConvertError('')
    if (convertSplit.length === 0) {
      setConvertError('Split it between at least one person.')
      return
    }
    setIsConverting(true)
    try {
      const res = await api.post(`/trips/${tripId}/bookings/${bookingId}/convert-to-expense`, {
        paidBy: convertPaidBy,
        splitBetween: convertSplit,
      })
      setBookings((b) => b.map((x) => (x.bookingId === bookingId ? res.booking : x)))
      setConvertingId(null)
    } catch (err) {
      setConvertError(err.message || 'Could not add this to expenses.')
    } finally {
      setIsConverting(false)
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
              if (showAdd) closeAddFlow()
              else setShowAdd(true)
            }}
          >
            <Icon name="plus" />
            {showAdd ? 'Cancel' : 'Add booking'}
          </button>
        </div>
      </div>

      <TripTabs tripId={tripId} active="bookings" showToday showRecap={!!trip?.completedAt} />

      {loading && (
        <div className="panel glass" style={{ padding: 24 }}>
          <p className="eyebrow">Loading…</p>
        </div>
      )}

      {!loading && loadError && <div className="error-banner">{loadError}</div>}

      {!loading && !loadError && (
        <>
          {showAdd && addMethod === null && (
            <div className="panel glass add-method-panel" style={{ marginBottom: 16 }}>
              <p className="eyebrow" style={{ marginBottom: 12 }}>Add a booking</p>
              <div className="add-method-row">
                <button type="button" className="add-method-card" onClick={() => setAddMethod('extract')}>
                  <Icon name="sparkle" />
                  <span className="t">Extract from image</span>
                  <span className="s">Upload a screenshot or photo</span>
                </button>
                <button type="button" className="add-method-card" onClick={() => setAddMethod('manual')}>
                  <Icon name="sliders" />
                  <span className="t">Add manually</span>
                  <span className="s">Fill in the details yourself</span>
                </button>
              </div>
            </div>
          )}

          {showAdd && addMethod === 'manual' && (
            <div style={{ marginBottom: 16 }}>
              <BookingForm tripId={tripId} onSaved={handleAdded} onCancel={() => setAddMethod(null)} />
            </div>
          )}

          {showAdd && addMethod === 'extract' && !extractedPrefill && (
            <div className="panel glass" style={{ marginBottom: 16, padding: 20 }}>
              {extractError && <div className="error-banner">{extractError}</div>}
              <p className="eyebrow" style={{ marginBottom: 8 }}>Upload a confirmation image</p>
              <p className="q-sub" style={{ marginBottom: 14 }}>
                A screenshot or photo of the booking confirmation — hotel, car rental, or similar.
              </p>
              <label className={`file-drop${extracting ? ' busy' : ''}`}>
                <Icon name={extracting ? 'refresh' : 'plus'} />
                {extracting ? 'Reading image…' : 'Choose an image'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  hidden
                  disabled={extracting}
                  onChange={handleFileSelected}
                />
              </label>
              <button type="button" className="btn ghost" style={{ marginTop: 14 }} onClick={() => setAddMethod(null)}>
                Back
              </button>
            </div>
          )}

          {showAdd && addMethod === 'extract' && extractedPrefill && (
            <div style={{ marginBottom: 16 }}>
              <div className="notice-banner">
                <Icon name="sparkle" />
                Pre-filled from your image — review the details below before saving.
              </div>
              <BookingForm
                tripId={tripId}
                prefill={extractedPrefill}
                onSaved={handleAdded}
                onCancel={() => {
                  setAddMethod(null)
                  setExtractedPrefill(null)
                }}
              />
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
                  <Fragment key={b.bookingId}>
                  <StaggerItem>
                    <div className="booking-ticket panel glass">
                      <span className="ticket-stub">
                        <Icon name={BOOKING_ICONS[b.type] || 'flag'} />
                      </span>
                      <div className="ticket-body">
                        <div className="ticket-name">
                          {b.name}
                          <span className="booking-type">{BOOKING_TYPE_LABEL[b.type] || 'Other'}</span>
                        </div>
                        {b.confirmation && <div className="ticket-conf mono">{b.confirmation}</div>}
                        <div className="note">
                          {startLabel} {fmtDateTime(b.startDatetime)} · {endLabel} {fmtDateTime(b.endDatetime)}
                        </div>
                        {b.location && (
                          <div className="note">
                            <Icon name="pin" /> {b.location}
                          </div>
                        )}
                        {(b.type === 'hotel' && b.breakfastIncluded) ||
                        b.convertedExpenseId ||
                        (b.referenceLink && HTTP_URL_RE.test(b.referenceLink)) ? (
                          <div className="ticket-tags">
                            {b.type === 'hotel' && b.breakfastIncluded && (
                              <span className="amenity-badge">
                                <Icon name="fork" /> Breakfast incl.
                              </span>
                            )}
                            {b.convertedExpenseId && (
                              <span className="amenity-badge">
                                <Icon name="check" /> Added to expenses
                              </span>
                            )}
                            {b.referenceLink && HTTP_URL_RE.test(b.referenceLink) && (
                              <a href={b.referenceLink} target="_blank" rel="noopener noreferrer" className="ref-link">
                                <Icon name="link" />
                                reference
                              </a>
                            )}
                          </div>
                        ) : null}
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
                          {b.cost != null && !b.convertedExpenseId && (
                            <button type="button" className="btn small ghost" onClick={() => startConvert(b)}>
                              <Icon name="wallet" />
                              Add to expenses
                            </button>
                          )}
                        </div>
                      </div>
                      <span className="ticket-perf" aria-hidden="true" />
                      <div className="ticket-cost mono">{b.cost != null ? `$${b.cost}` : '—'}</div>
                    </div>
                  </StaggerItem>

                  {convertingId === b.bookingId && (
                    <StaggerItem key={`${b.bookingId}-convert`}>
                      <div className="panel glass" style={{ marginBottom: 12, padding: 20 }}>
                        {convertError && <div className="error-banner">{convertError}</div>}
                        <p className="eyebrow" style={{ marginBottom: 4 }}>Add to expenses</p>
                        <p className="q-sub" style={{ marginBottom: 14 }}>
                          {b.name} — ${b.cost}
                        </p>
                        <div className="row2">
                          <div className="field">
                            <label htmlFor="convertPaidBy">Paid by</label>
                            <div className="field-input">
                              <Icon name="users" />
                              <select
                                id="convertPaidBy"
                                value={convertPaidBy}
                                onChange={(e) => setConvertPaidBy(e.target.value)}
                              >
                                {members.map((m) => (
                                  <option key={m.userId} value={m.userId}>
                                    {memberLabel(m.userId)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="field">
                          <label>Split between</label>
                          <div className="chip-grid">
                            {members.map((m) => (
                              <button
                                key={m.userId}
                                type="button"
                                className="chip"
                                aria-pressed={convertSplit.includes(m.userId)}
                                onClick={() => toggleConvertSplit(m.userId)}
                              >
                                {memberLabel(m.userId)}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="q-actions">
                          <button type="button" className="btn ghost" onClick={() => setConvertingId(null)}>
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn accent"
                            disabled={isConverting}
                            onClick={() => handleConvert(b.bookingId)}
                          >
                            <Icon name="check" />
                            {isConverting ? 'Adding…' : 'Add to expenses'}
                          </button>
                        </div>
                      </div>
                    </StaggerItem>
                  )}
                  </Fragment>
                )
              })}
            </StaggerContainer>
          )}
        </>
      )}
    </AppShell>
  )
}
