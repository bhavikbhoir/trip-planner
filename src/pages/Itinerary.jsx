import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import { StaggerContainer, StaggerItem } from '../components/motion'
import BookingForm from '../components/BookingForm'
import DayMap from '../components/DayMap'
import './pages.scss'

const HTTP_URL_RE = /^https?:\/\//i
// Generation now runs asynchronously in the background (the previous synchronous
// path hit API Gateway's hard 29s ceiling) — POST just triggers it, and we poll
// the trip until a new plan version (or a recorded error) shows up.
const GENERATE_POLL_INTERVAL_MS = 3000
const GENERATE_POLL_TIMEOUT_MS = 90000
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
  const navigate = useNavigate()
  const { user } = useAuth()

  const [trip, setTrip] = useState(null)
  const [members, setMembers] = useState([])
  const [logistics, setLogistics] = useState([])
  const [bookings, setBookings] = useState([])
  const [plans, setPlans] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [approvals, setApprovals] = useState([])
  const [weather, setWeather] = useState(null)
  const [loadError, setLoadError] = useState('')

  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const [suggestionText, setSuggestionText] = useState('')
  const [isAddingSuggestion, setIsAddingSuggestion] = useState(false)
  const [suggestionError, setSuggestionError] = useState('')

  const [isApproving, setIsApproving] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [finalizeError, setFinalizeError] = useState('')

  const [confirmingExit, setConfirmingExit] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [exitError, setExitError] = useState('')

  const mountedRef = useRef(true)
  const pollTimeoutRef = useRef(null)

  useEffect(() => {
    // Explicit assignment here (not just the initial useRef(true)) matters:
    // React 18 StrictMode double-invokes effects in dev (mount → cleanup →
    // mount again), and the cleanup below sets this false — without
    // resetting it true on (re-)mount, every poll would see mounted=false
    // and die silently on its first tick in dev, even though the component
    // is genuinely still mounted.
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
    }
  }, [])

  function applyTripResponse(res) {
    setTrip(res.trip)
    setMembers(res.members || [])
    setLogistics(res.logistics || [])
    setBookings(res.bookings || [])
    setPlans(res.plans || [])
    setSuggestions(res.suggestions || [])
    setApprovals(res.approvals || [])
    return res
  }

  async function loadTrip() {
    const res = await api.get(`/trips/${tripId}`)
    applyTripResponse(res)
  }

  useEffect(() => {
    loadTrip().catch((err) => setLoadError(err.message || 'Could not load this trip.'))
    // Best-effort — a missing/failed weather fetch shouldn't block the page.
    api
      .get(`/trips/${tripId}/weather`)
      .then((res) => setWeather(res.weather))
      .catch(() => setWeather(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  async function handleGenerate() {
    setGenerateError('')
    setIsGenerating(true)

    const versionBefore = latestPlan ? latestPlan.version : 0
    const startedAt = Date.now()

    try {
      await api.post(`/trips/${tripId}/plan/generate`)
    } catch (err) {
      if (mountedRef.current) {
        setGenerateError(err.message || 'Could not start generating an itinerary — you can try again.')
        setIsGenerating(false)
      }
      return
    }

    pollForPlan(versionBefore, startedAt)
  }

  function pollForPlan(versionBefore, startedAt) {
    const poll = async () => {
      if (!mountedRef.current) return

      if (Date.now() - startedAt > GENERATE_POLL_TIMEOUT_MS) {
        setGenerateError('This is taking longer than expected — try again.')
        setIsGenerating(false)
        return
      }

      try {
        const res = await api.get(`/trips/${tripId}`)
        if (!mountedRef.current) return

        const newVersion = (res.plans || []).reduce((max, p) => Math.max(max, p.version), 0)
        const errAt = res.trip?.lastGenerationError?.at ? new Date(res.trip.lastGenerationError.at).getTime() : null

        if (newVersion > versionBefore) {
          applyTripResponse(res)
          setIsGenerating(false)
          return
        }

        if (errAt && errAt >= startedAt) {
          applyTripResponse(res)
          setGenerateError(res.trip.lastGenerationError.message || 'Could not generate an itinerary — you can try again.')
          setIsGenerating(false)
          return
        }
      } catch {
        // Transient failure mid-poll — keep trying until the overall timeout, rather
        // than aborting the whole wait over one flaky request.
      }

      pollTimeoutRef.current = setTimeout(poll, GENERATE_POLL_INTERVAL_MS)
    }

    poll()
  }

  function handleBookingCreated(booking) {
    setBookings((b) => [...b, booking])
    setShowBookingForm(false)
  }

  async function handleCopyInvite() {
    const url = `${window.location.origin}/trip/${tripId}/join`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Copy this invite link:', url)
      return
    }
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  function memberLabel(userId) {
    if (userId === user?.userId) return 'You'
    const m = members.find((m) => m.userId === userId)
    return m?.displayName || 'A traveler'
  }

  async function handleAddSuggestion(e) {
    e.preventDefault()
    if (!suggestionText.trim() || !latestPlan) return
    setSuggestionError('')
    setIsAddingSuggestion(true)
    try {
      await api.post(`/trips/${tripId}/suggestions`, { text: suggestionText.trim(), targetPlanVersion: latestPlan.version })
      setSuggestionText('')
      await loadTrip()
    } catch (err) {
      setSuggestionError(err.message || 'Could not add that suggestion.')
    } finally {
      setIsAddingSuggestion(false)
    }
  }

  async function handleDismissSuggestion(suggestionId) {
    try {
      await api.delete(`/trips/${tripId}/suggestions/${suggestionId}`)
      setSuggestions((s) => s.filter((x) => x.suggestionId !== suggestionId))
    } catch (err) {
      setSuggestionError(err.message || 'Could not dismiss that suggestion.')
    }
  }

  async function handleApprove() {
    if (!latestPlan) return
    setIsApproving(true)
    setFinalizeError('')
    try {
      await api.put(`/trips/${tripId}/approvals/me`, { planVersion: latestPlan.version })
      await loadTrip()
    } catch (err) {
      setFinalizeError(err.message || 'Could not record your approval.')
    } finally {
      setIsApproving(false)
    }
  }

  async function handleLeaveOrDelete() {
    setExitError('')
    setIsExiting(true)
    try {
      if (isOwner) {
        await api.delete(`/trips/${tripId}`)
      } else {
        await api.delete(`/trips/${tripId}/members/me`)
      }
      navigate('/')
    } catch (err) {
      setExitError(err.message || (isOwner ? 'Could not delete this trip.' : 'Could not leave this trip.'))
      setIsExiting(false)
    }
  }

  async function handleFinalize() {
    setIsFinalizing(true)
    setFinalizeError('')
    try {
      const res = await api.post(`/trips/${tripId}/finalize`)
      setTrip(res.trip)
    } catch (err) {
      setFinalizeError(err.message || 'Could not finalize this trip.')
    } finally {
      setIsFinalizing(false)
    }
  }

  const latestPlan = plans.length ? plans.reduce((a, b) => (b.version > a.version ? b : a)) : null
  const allCompanions = members.flatMap((m) => (m.companions || []).map((c) => ({ ...c, memberId: m.userId })))
  const hasAnchors = logistics.length > 0 || bookings.length > 0 || allCompanions.length > 0

  const isOwner = trip && user && trip.ownerId === user.userId
  const openSuggestions = latestPlan
    ? suggestions.filter((s) => s.targetPlanVersion === latestPlan.version && s.status !== 'dismissed')
    : []
  const approvedUserIds = latestPlan
    ? new Set(approvals.filter((a) => a.planVersion === latestPlan.version).map((a) => a.userId))
    : new Set()
  const youApproved = user ? approvedUserIds.has(user.userId) : false
  const allApproved = members.length > 0 && members.every((m) => approvedUserIds.has(m.userId))
  const isFinalized = trip?.status === 'finalized'

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
              {isFinalized && (
                <span className="status-pill final" style={{ marginLeft: 8 }}>
                  <span className="dot" />
                  Finalized
                </span>
              )}
            </div>
          )}
          <h1 style={{ fontSize: '1.15rem', marginTop: latestPlan ? 4 : 0 }}>{trip ? trip.name : 'Loading…'}</h1>
        </div>
        <div className="itin-actions">
          <button className="btn small ghost" type="button" onClick={handleCopyInvite}>
            <Icon name={linkCopied ? 'check' : 'link'} />
            {linkCopied ? 'Link copied' : 'Invite'}
          </button>
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
          {trip && (
            <button className="btn small warn" type="button" onClick={() => setConfirmingExit(true)}>
              <Icon name="x" />
              {isOwner ? 'Delete trip' : 'Leave trip'}
            </button>
          )}
        </div>
      </div>

      {confirmingExit && (
        <div className="confirm-banner">
          <span>
            {isOwner
              ? 'Delete this trip? This removes it and everything in it — bookings, plans, suggestions — for everyone. This can’t be undone.'
              : 'Leave this trip? You can rejoin later with the invite link.'}
            {exitError && <strong style={{ display: 'block', marginTop: 4, color: 'var(--warn)' }}>{exitError}</strong>}
          </span>
          <span className="confirm-actions">
            <button
              className="btn small ghost"
              type="button"
              onClick={() => {
                setConfirmingExit(false)
                setExitError('')
              }}
              disabled={isExiting}
            >
              Cancel
            </button>
            <button className="btn small warn solid" type="button" onClick={handleLeaveOrDelete} disabled={isExiting}>
              {isExiting ? (isOwner ? 'Deleting…' : 'Leaving…') : isOwner ? 'Confirm delete' : 'Confirm leave'}
            </button>
          </span>
        </div>
      )}

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

      {weather && (
        <div className="weather-chip glass">
          <Icon name="sun" />
          <span>
            Current conditions in {weather.city}: {weather.temperature}°F, {weather.condition}
          </span>
        </div>
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

          {logistics
            .filter((l) => l.transportMode === 'driving' || l.transportMode === 'need_ride')
            .map((l) => (
              <div className="anchor-row" key={`transport-${l.userId}`}>
                <span className="icon-badge">
                  <Icon name={l.transportMode === 'driving' ? 'car' : 'users'} />
                </span>
                <span>
                  {l.transportMode === 'driving'
                    ? `${memberLabel(l.userId)} is driving${l.seatsAvailable ? ` — ${l.seatsAvailable} seat${l.seatsAvailable === 1 ? '' : 's'} free` : ''}`
                    : `${memberLabel(l.userId)} needs a ride`}
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
              <DayMap events={day.events} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {!isGenerating && latestPlan && (
        <div className="collab-grid">
          <div className="panel glass">
            <div className="section-title">
              <h2>Suggestions on v{latestPlan.version}</h2>
            </div>

            {suggestionError && <div className="error-banner">{suggestionError}</div>}

            {openSuggestions.length === 0 && <p className="q-sub">No open suggestions — add one below.</p>}

            {openSuggestions.map((s) => (
              <div className="suggestion" key={s.suggestionId}>
                <div className="who">{memberLabel(s.authorId)}</div>
                <div className="txt">"{s.text}"</div>
                <div className="acts">
                  <button className="btn small ghost" type="button" onClick={() => handleDismissSuggestion(s.suggestionId)}>
                    <Icon name="x" />
                    Dismiss
                  </button>
                </div>
              </div>
            ))}

            <form className="suggestion-form" onSubmit={handleAddSuggestion}>
              <div className="field-input">
                <Icon name="chat" />
                <input
                  type="text"
                  placeholder="Suggest a change for the next version…"
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                />
              </div>
              <button className="btn small accent" type="submit" disabled={isAddingSuggestion || !suggestionText.trim()}>
                {isAddingSuggestion ? 'Adding…' : 'Add'}
              </button>
            </form>
          </div>

          <div className="panel glass">
            <div className="section-title">
              <h2>Approvals — v{latestPlan.version}</h2>
            </div>

            <div className="approval-list">
              {members.map((m) => {
                const approved = approvedUserIds.has(m.userId)
                const initial = (memberLabel(m.userId) || '?').charAt(0).toUpperCase()
                return (
                  <div className="approval-row" key={m.userId}>
                    <span className={`ring ${approved ? 'yes' : 'pending'}`}>{initial}</span>
                    <div>
                      <div className="approval-name">{memberLabel(m.userId)}</div>
                      <div className={`approval-status ${approved ? 'yes' : ''}`}>
                        {approved ? 'Approved' : 'Pending'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {finalizeError && <div className="error-banner">{finalizeError}</div>}

            {!isFinalized && (
              <>
                {!youApproved && (
                  <button className="btn small ghost" type="button" onClick={handleApprove} disabled={isApproving}>
                    <Icon name="check" />
                    {isApproving ? 'Approving…' : 'Approve this plan'}
                  </button>
                )}
                <button
                  className="btn accent"
                  type="button"
                  onClick={handleFinalize}
                  disabled={isFinalizing || (!isOwner && !allApproved)}
                  style={{ marginTop: 10, width: '100%' }}
                >
                  <Icon name="check" />
                  {isFinalizing ? 'Finalizing…' : 'Finalize trip'}
                </button>
                <div className="finalize-note">
                  {isOwner
                    ? allApproved
                      ? 'Everyone has approved.'
                      : 'As owner, you can finalize anytime — or wait for everyone to approve.'
                    : `Needs everyone's approval — ${approvedUserIds.size} of ${members.length} in.`}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
