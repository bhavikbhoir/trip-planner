import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../utils/api'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import { StaggerContainer, StaggerItem } from '../components/motion'
import TripTabs from '../components/TripTabs'
import './pages.scss'

const HTTP_URL_RE = /^https?:\/\//i
const EVENT_ICONS = { plane: 'plane', hotel: 'bed', car: 'car', food: 'fork', activity: 'mountain', other: 'flag' }
const BOOKING_ICONS = { hotel: 'bed', car: 'car', other: 'flag' }
const BOOKING_LABELS = {
  hotel: ['check-in', 'check-out'],
  car: ['pickup', 'dropoff'],
  other: ['starts', 'ends'],
}
const STATUS_ICON = { done: 'check', skipped: 'x', swapped: 'refresh' }
// PUT sets that status (and, server-side, clears the other two); DELETE
// clears it back to no status. Note edits (skip/swap only) re-PUT the same
// endpoint with an updated note — idempotent, so no separate "edit" route.
const STATUS_PATH = {
  done: (tripId, eventId) => `/trips/${tripId}/events/${eventId}/done`,
  skipped: (tripId, eventId) => `/trips/${tripId}/events/${eventId}/skip`,
  swapped: (tripId, eventId) => `/trips/${tripId}/events/${eventId}/swap`,
}

function fmtDateTime(v) {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// travelFromPrevious.drive is real OSRM road-network routing; walkMinutes is
// a straight-line-distance estimate (see trip-planner-api/shared/osrm.js),
// so it's always phrased as an estimate, never presented as routed.
function fmtTravel(t) {
  if (!t) return null
  const walk = `~${t.walkMinutes} min walk`
  if (t.drive) {
    const km = (t.drive.distanceMeters / 1000).toFixed(1)
    return `${t.drive.durationMinutes} min drive (${km} km) or ${walk}`
  }
  return `${walk} (${t.straightLineMeters}m, straight-line estimate)`
}

function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shiftIso(iso, deltaDays) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + deltaDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// "Today" isn't the only day worth checking off — an activity from
// yesterday (or tomorrow, planned in advance) needs the same Done/Skip/Swap
// controls, not just whatever the calendar says right now.
function relativeDayLabel(viewDate, today) {
  if (viewDate === today) return 'Today'
  const diffDays = Math.round((new Date(`${viewDate}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000)
  if (diffDays === -1) return 'Yesterday'
  if (diffDays === 1) return 'Tomorrow'
  return diffDays < 0 ? `${-diffDays} days ago` : `In ${diffDays} days`
}

// The one-job view: what's happening today, in order, nothing else. No
// preferences, no suggestions, no version history — this exists for the
// moment on the trip itself, not for planning it. Each event gets one of
// three mutually-exclusive statuses (done / skipped / did-something-else,
// with an optional note on the latter two) — the trip is already planned,
// this just tracks what actually happened, feeding the post-trip recap.
export default function DayOf() {
  const { tripId } = useParams()
  const [viewDate, setViewDate] = useState(todayIso())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  async function handleSetStatus(eventId, status) {
    const current = data?.events.find((ev) => ev.eventId === eventId)
    const prevStatus = current?.status || null
    const prevNote = current?.statusNote || null
    const nextStatus = prevStatus === status ? null : status

    setData((d) =>
      d
        ? {
            ...d,
            events: d.events.map((ev) =>
              ev.eventId === eventId ? { ...ev, status: nextStatus, done: nextStatus === 'done', statusNote: nextStatus ? ev.statusNote : null } : ev
            ),
          }
        : d
    )

    try {
      if (nextStatus) await api.put(STATUS_PATH[nextStatus](tripId, eventId))
      else await api.delete(STATUS_PATH[prevStatus](tripId, eventId))
    } catch {
      setData((d) =>
        d
          ? {
              ...d,
              events: d.events.map((ev) =>
                ev.eventId === eventId ? { ...ev, status: prevStatus, done: prevStatus === 'done', statusNote: prevNote } : ev
              ),
            }
          : d
      )
    }
  }

  function handleNoteInput(eventId, statusNote) {
    setData((d) => (d ? { ...d, events: d.events.map((ev) => (ev.eventId === eventId ? { ...ev, statusNote } : ev)) } : d))
  }

  async function handleNoteSave(eventId, status, note) {
    if (status !== 'skipped' && status !== 'swapped') return
    try {
      await api.put(STATUS_PATH[status](tripId, eventId), { note })
    } catch {
      // Note is a nice-to-have annotation on an already-saved status — a
      // failed save here isn't worth a revert-and-error-banner; it'll just
      // retry next edit.
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')
    api
      .get(`/trips/${tripId}/today?date=${viewDate}`)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e.message || 'Could not load that day’s plan')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tripId, viewDate])

  return (
    <AppShell>
      <div className="itin-head">
        <div>
          <div className="eyebrow plan-badge">
            <Icon name="sun" />
            {relativeDayLabel(viewDate, todayIso())}
          </div>
          <h1 className="page-title" style={{ marginTop: 4 }}>{data?.date || viewDate}</h1>
        </div>
        <div className="itin-actions">
          <button className="btn small ghost" type="button" onClick={() => setViewDate((d) => shiftIso(d, -1))}>
            ‹ Previous day
          </button>
          {viewDate !== todayIso() && (
            <button className="btn small ghost" type="button" onClick={() => setViewDate(todayIso())}>
              Today
            </button>
          )}
          <button className="btn small ghost" type="button" onClick={() => setViewDate((d) => shiftIso(d, 1))}>
            Next day ›
          </button>
        </div>
      </div>

      <TripTabs tripId={tripId} active="today" showToday showRecap={!!data?.tripCompletedAt} />

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
            <div className="panel glass empty-state">
              <Icon name="sun" />
              <p>{viewDate === todayIso() ? 'Nothing on the plan for today.' : 'Nothing on the plan for this day.'}</p>
            </div>
          ) : (
            <StaggerContainer>
              <StaggerItem className="day-block">
                {data.events.map((ev, j) => (
                  <div className={`event${ev.status ? ` status-${ev.status}` : ''}`} key={j}>
                    <span className="event-node">
                      <Icon name={(ev.status && STATUS_ICON[ev.status]) || EVENT_ICONS[ev.icon] || 'flag'} />
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
                      {ev.travelFromPrevious && (
                        <div className="osm-note">
                          <Icon name="route" />
                          {fmtTravel(ev.travelFromPrevious)}
                        </div>
                      )}
                      {ev.transitEstimate && <div className="note">Transit: {ev.transitEstimate}</div>}
                      {ev.note && <div className="note">{ev.note}</div>}
                      {ev.openingHours && (
                        <div className="osm-note">
                          <Icon name="clock" />
                          {ev.openingHours}
                        </div>
                      )}
                      {ev.nearbyParking && (
                        <div className="osm-note">
                          <Icon name="car" />
                          Parking nearby: {ev.nearbyParking}
                        </div>
                      )}

                      <div className="check-pills">
                        <button
                          type="button"
                          className="check-pill done"
                          aria-pressed={ev.status === 'done'}
                          onClick={() => handleSetStatus(ev.eventId, 'done')}
                        >
                          <Icon name="check" />
                          Done
                        </button>
                        <button
                          type="button"
                          className="check-pill skipped"
                          aria-pressed={ev.status === 'skipped'}
                          onClick={() => handleSetStatus(ev.eventId, 'skipped')}
                        >
                          <Icon name="x" />
                          Skip
                        </button>
                        <button
                          type="button"
                          className="check-pill swapped"
                          aria-pressed={ev.status === 'swapped'}
                          onClick={() => handleSetStatus(ev.eventId, 'swapped')}
                        >
                          <Icon name="refresh" />
                          Did something else
                        </button>
                      </div>

                      {(ev.status === 'skipped' || ev.status === 'swapped') && (
                        <input
                          type="text"
                          className="status-note-input"
                          placeholder={ev.status === 'swapped' ? 'What did you do instead?' : 'Why skip it? (optional)'}
                          value={ev.statusNote || ''}
                          onChange={(e) => handleNoteInput(ev.eventId, e.target.value)}
                          onBlur={(e) => handleNoteSave(ev.eventId, ev.status, e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </StaggerItem>
            </StaggerContainer>
          )}
        </>
      )}
    </AppShell>
  )
}
