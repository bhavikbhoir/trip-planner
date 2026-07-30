import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import { StaggerContainer, StaggerItem } from '../components/motion'
import BookingForm from '../components/BookingForm'
import './pages.scss'

const EVENT_ICONS = { plane: 'plane', hotel: 'bed', car: 'car', food: 'fork', activity: 'mountain', other: 'flag' }
const BOOKING_ICONS = { hotel: 'bed', car: 'car', other: 'flag' }
const BOOKING_LABELS = {
  hotel: ['check-in', 'check-out'],
  car: ['pickup', 'dropoff'],
  other: ['start', 'end'],
}

function fmtDateTime(v) {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function Itinerary() {
  const { tripId } = useParams()
  const { user } = useAuth()

  const [trip, setTrip] = useState(null)
  const [members, setMembers] = useState([])
  const [logistics, setLogistics] = useState([])
  const [bookings, setBookings] = useState([])
  const [plans, setPlans] = useState([])
  const [loadError, setLoadError] = useState('')

  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [showBookingForm, setShowBookingForm] = useState(false)

  async function loadTrip() {
    const res = await api.get(`/trips/${tripId}`)
    setTrip(res.trip)
    setMembers(res.members || [])
    setLogistics(res.logistics || [])
    setBookings(res.bookings || [])
    setPlans(res.plans || [])
  }

  useEffect(() => {
    loadTrip().catch((err) => setLoadError(err.message || 'Could not load this trip.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  async function handleGenerate() {
    setGenerateError('')
    setIsGenerating(true)
    try {
      await api.post(`/trips/${tripId}/plan/generate`)
      await loadTrip()
    } catch (err) {
      setGenerateError(err.message || 'Could not generate an itinerary — you can try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleBookingCreated(booking) {
    setBookings((b) => [...b, booking])
    setShowBookingForm(false)
  }

  function memberLabel(userId) {
    return userId === user?.userId ? 'You' : 'A traveler'
  }

  const latestPlan = plans.length ? plans.reduce((a, b) => (b.version > a.version ? b : a)) : null
  const allCompanions = members.flatMap((m) => (m.companions || []).map((c) => ({ ...c, memberId: m.userId })))
  const hasAnchors = logistics.length > 0 || bookings.length > 0 || allCompanions.length > 0

  if (loadError) {
    return (
      <AppShell>
        <div className="error-banner">{loadError}</div>
      </AppShell>
    )
  }

  return (
    <AppShell
      actions={
        <Link className="btn ghost small" to={`/trip/${tripId}/preferences`}>
          <Icon name="sliders" />
          Preferences
        </Link>
      }
    >
      <div className="itin-head">
        <div>
          {latestPlan && (
            <div className="eyebrow plan-badge">
              <Icon name="route" />
              Plan v{latestPlan.version}
            </div>
          )}
          <h1 style={{ fontSize: '1.15rem', marginTop: latestPlan ? 4 : 0 }}>{trip ? trip.name : 'Loading…'}</h1>
        </div>
        <div className="itin-actions">
          <button className="btn small ghost" type="button" onClick={() => setShowBookingForm((s) => !s)}>
            <Icon name="plus" />
            {showBookingForm ? 'Cancel' : 'Add booking'}
          </button>
          {latestPlan && (
            <button className="btn small accent" type="button" onClick={handleGenerate} disabled={isGenerating}>
              <Icon name="refresh" />
              {isGenerating ? 'Generating…' : 'Regenerate'}
            </button>
          )}
        </div>
      </div>

      {generateError && (
        <div className="error-banner">
          {generateError}
          <button className="btn small ghost" type="button" onClick={handleGenerate} style={{ marginLeft: 10 }}>
            Retry
          </button>
        </div>
      )}

      {showBookingForm && (
        <BookingForm tripId={tripId} onCreated={handleBookingCreated} onCancel={() => setShowBookingForm(false)} />
      )}

      {hasAnchors && (
        <div className="anchor-strip glass">
          {logistics
            .filter((l) => l.arrival || l.departure)
            .map((l) => (
              <div className="anchor-row" key={l.userId}>
                <span className="icon-badge">
                  <Icon name="plane" />
                </span>
                <span>
                  {memberLabel(l.userId)}
                  {l.arrival?.datetime && <> arrives {fmtDateTime(l.arrival.datetime)}</>}
                  {l.departure?.datetime && <> · departs {fmtDateTime(l.departure.datetime)}</>}
                </span>
              </div>
            ))}

          {bookings.map((b) => {
            const [startLabel, endLabel] = BOOKING_LABELS[b.type] || BOOKING_LABELS.other
            return (
              <div className="anchor-row" key={b.bookingId}>
                <span className="icon-badge">
                  <Icon name={BOOKING_ICONS[b.type] || 'flag'} />
                </span>
                <span>
                  {b.name} — {startLabel} {fmtDateTime(b.startDatetime)} · {endLabel} {fmtDateTime(b.endDatetime)}
                  {b.confirmation && <> · conf #{b.confirmation}</>}
                </span>
              </div>
            )
          })}

          {allCompanions.length > 0 && (
            <div className="anchor-row">
              <span className="icon-badge">
                <Icon name="baby" />
              </span>
              <span>Traveling with {allCompanions.map((c) => `${c.name} (${c.age})`).join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {isGenerating && (
        <div className="panel glass generating-panel">
          <div className="generating-badge">
            <Icon name="sparkle" />
          </div>
          <p className="q-title">
            AI is planning your trip
            <span className="generating-dots">
              <span />
              <span />
              <span />
            </span>
          </p>
          <p className="q-sub">Aggregating preferences, logistics, and live weather — this can take a few seconds.</p>
        </div>
      )}

      {!isGenerating && !latestPlan && (
        <div className="panel glass generating-panel">
          <p className="q-title">No itinerary yet</p>
          <p className="q-sub">Generate one once everyone's added their preferences.</p>
          <button className="btn accent" type="button" onClick={handleGenerate}>
            <Icon name="sparkle" />
            Generate itinerary
          </button>
        </div>
      )}

      {!isGenerating && latestPlan && (
        <StaggerContainer>
          {latestPlan.days.map((day, i) => (
            <StaggerItem key={i} className="day-block">
              <div className="day-head">
                <span className="day-num">Day {i + 1}</span>
                <span className="day-date mono">{day.date}</span>
              </div>
              {day.events.map((ev, j) => (
                <div className="event" key={j}>
                  <span className="event-node">
                    <Icon name={EVENT_ICONS[ev.icon] || 'flag'} />
                  </span>
                  <div className="event-body">
                    <div className="time mono">{ev.time}</div>
                    <div className="desc">{ev.title}</div>
                    {ev.note && <div className="note">{ev.note}</div>}
                  </div>
                </div>
              ))}
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </AppShell>
  )
}
