import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../utils/api'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import { StaggerContainer, StaggerItem } from '../components/motion'
import './pages.scss'

const HTTP_URL_RE = /^https?:\/\//i
const EVENT_ICONS = { plane: 'plane', hotel: 'bed', car: 'car', food: 'fork', activity: 'mountain', other: 'flag' }
const BOOKING_ICONS = { hotel: 'bed', car: 'car', other: 'flag' }
const BOOKING_LABELS = {
  hotel: ['check-in', 'check-out'],
  car: ['pickup', 'dropoff'],
  other: ['starts', 'ends'],
}

function fmtDateTime(v) {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// The one-job view: what's happening today, in order, nothing else. No
// preferences, no suggestions, no version history — this exists for the
// moment on the trip itself, not for planning it. Checking an event off
// just marks it done; there's no sub-list, no notes — the trip is already
// planned, this is just tracking what's actually happened so far today.
export default function DayOf() {
  const { tripId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  async function handleToggleDone(eventId, done) {
    setData((d) => (d ? { ...d, events: d.events.map((ev) => (ev.eventId === eventId ? { ...ev, done } : ev)) } : d))
    try {
      if (done) await api.put(`/trips/${tripId}/events/${eventId}/done`)
      else await api.delete(`/trips/${tripId}/events/${eventId}/done`)
    } catch {
      // Revert on failure
      setData((d) => (d ? { ...d, events: d.events.map((ev) => (ev.eventId === eventId ? { ...ev, done: !done } : ev)) } : d))
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')
    api
      .get(`/trips/${tripId}/today?date=${todayIso()}`)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e.message || 'Could not load today’s plan')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tripId])

  return (
    <AppShell
      actions={
        <Link className="btn ghost small" to={`/trip/${tripId}/itinerary`}>
          <Icon name="route" />
          Full itinerary
        </Link>
      }
    >
      <div className="itin-head">
        <div>
          <div className="eyebrow plan-badge">
            <Icon name="sun" />
            Today
          </div>
          <h1 style={{ fontSize: '1.15rem', marginTop: 4 }}>{data?.date || todayIso()}</h1>
        </div>
      </div>

      {loading && (
        <div className="panel glass" style={{ padding: 24 }}>
          <p className="eyebrow">Loading…</p>
        </div>
      )}

      {!loading && loadError && <div className="error-banner">{loadError}</div>}

      {!loading && !loadError && data && (
        <>
          {data.bookings.length > 0 && (
            <div className="panel glass" style={{ marginBottom: 16 }}>
              {data.bookings.map((b) => {
                const [startLabel, endLabel] = BOOKING_LABELS[b.type] || BOOKING_LABELS.other
                return (
                  <div className="anchor-row" key={b.bookingId}>
                    <span className="icon-badge">
                      <Icon name={BOOKING_ICONS[b.type] || 'flag'} />
                    </span>
                    <span>
                      {b.name} — {startLabel} {fmtDateTime(b.startDatetime)} · {endLabel} {fmtDateTime(b.endDatetime)}
                      {b.referenceLink && HTTP_URL_RE.test(b.referenceLink) && (
                        <>
                          {' · '}
                          <a href={b.referenceLink} target="_blank" rel="noopener noreferrer" className="ref-link">
                            <Icon name="link" />
                            reference
                          </a>
                        </>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {data.events.length === 0 ? (
            <div className="empty-state">
              <Icon name="sun" />
              <p>Nothing on the plan for today.</p>
            </div>
          ) : (
            <StaggerContainer>
              <StaggerItem className="day-block">
                {data.events.map((ev, j) => (
                  <label className={`event checkable${ev.done ? ' done' : ''}`} key={j}>
                    <input
                      type="checkbox"
                      className="event-check"
                      checked={!!ev.done}
                      onChange={(e) => handleToggleDone(ev.eventId, e.target.checked)}
                    />
                    <span className="event-node">
                      <Icon name={ev.done ? 'check' : EVENT_ICONS[ev.icon] || 'flag'} />
                    </span>
                    <div className="event-body">
                      <div className="time mono">{ev.time}</div>
                      <div className="desc">
                        {ev.title}
                        {ev.timeToSpend && (
                          <span className="event-cost mono">
                            <Icon name="clock" />
                            {ev.timeToSpend}
                          </span>
                        )}
                        {ev.costPerPerson != null && (
                          <span className="event-cost mono">${ev.costPerPerson}/person</span>
                        )}
                      </div>
                      {ev.note && <div className="note">{ev.note}</div>}
                    </div>
                  </label>
                ))}
              </StaggerItem>
            </StaggerContainer>
          )}
        </>
      )}
    </AppShell>
  )
}
