import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import { StaggerContainer, StaggerItem } from '../components/motion'
import TripTabs from '../components/TripTabs'
import { computeBalances, simplifyDebts } from '../utils/expenses'
import './pages.scss'

const MOODS = [
  { value: 'loved_it', label: 'Loved it', icon: 'heart' },
  { value: 'good', label: 'Good', icon: 'thumb' },
  { value: 'mixed', label: 'Mixed', icon: 'compass' },
  { value: 'rough', label: 'Rough', icon: 'x' },
]
const MOOD_LABEL = Object.fromEntries(MOODS.map((m) => [m.value, m.label]))
const MOOD_ICON = Object.fromEntries(MOODS.map((m) => [m.value, m.icon]))

function fmtDate(v) {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtMoney(n) {
  return `$${Math.abs(n).toFixed(2)}`
}

// The trip's closing view: what actually happened vs. what was planned (done
// / skipped / swapped, with notes), the final settle-up, and how the group
// felt about it. Only reachable once a trip has been marked complete — see
// handleComplete on Itinerary.jsx, which is where that decision gets made.
export default function Recap() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [trip, setTrip] = useState(null)
  const [members, setMembers] = useState([])
  const [plans, setPlans] = useState([])
  const [eventCompletions, setEventCompletions] = useState([])
  const [eventSkips, setEventSkips] = useState([])
  const [eventSwaps, setEventSwaps] = useState([])
  const [expenses, setExpenses] = useState([])
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [isCompleting, setIsCompleting] = useState(false)
  const [isReopening, setIsReopening] = useState(false)
  const [actionError, setActionError] = useState('')

  const [mood, setMood] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')

  function applyTripResponse(res) {
    setTrip(res.trip)
    setMembers(res.members || [])
    setPlans(res.plans || [])
    setEventCompletions(res.eventCompletions || [])
    setEventSkips(res.eventSkips || [])
    setEventSwaps(res.eventSwaps || [])
    setExpenses(res.expenses || [])
    setFeedback(res.feedback || [])
    const mine = (res.feedback || []).find((f) => f.userId === user?.userId)
    if (mine) {
      setMood(mine.mood)
      setComment(mine.comment || '')
    }
  }

  useEffect(() => {
    setLoading(true)
    api
      .get(`/trips/${tripId}`)
      .then(applyTripResponse)
      .catch((e) => setLoadError(e.message || 'Could not load this trip.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  function memberLabel(userId) {
    if (userId === user?.userId) return 'You'
    return members.find((m) => m.userId === userId)?.displayName || 'A traveler'
  }

  // See Itinerary.jsx/Expenses.jsx — memberLabel resolving to "You" breaks
  // subject-verb agreement against a third-person verb ("You owes").
  function verbFor(userId, thirdPerson, secondPerson) {
    return userId === user?.userId ? secondPerson : thirdPerson
  }

  async function handleComplete() {
    setIsCompleting(true)
    setActionError('')
    try {
      const res = await api.post(`/trips/${tripId}/complete`)
      setTrip(res.trip)
    } catch (err) {
      setActionError(err.message || 'Could not mark this trip complete.')
    } finally {
      setIsCompleting(false)
    }
  }

  async function handleReopen() {
    setIsReopening(true)
    setActionError('')
    try {
      const res = await api.delete(`/trips/${tripId}/complete`)
      setTrip(res.trip)
      navigate(`/trip/${tripId}/itinerary`)
    } catch (err) {
      setActionError(err.message || 'Could not reopen this trip.')
      setIsReopening(false)
    }
  }

  async function handleSubmitFeedback(e) {
    e.preventDefault()
    if (!mood) return
    setFeedbackError('')
    setIsSubmittingFeedback(true)
    try {
      const res = await api.put(`/trips/${tripId}/feedback/me`, { mood, comment: comment.trim() || undefined })
      setFeedback((f) => [...f.filter((x) => x.userId !== user?.userId), res.feedback])
    } catch (err) {
      setFeedbackError(err.message || 'Could not save your feedback.')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  const latestPlan = plans.length ? plans.reduce((a, b) => (b.version > a.version ? b : a)) : null
  const allEvents = latestPlan ? latestPlan.days.flatMap((d) => d.events.map((ev) => ({ ...ev, date: d.date }))) : []
  const eventById = new Map(allEvents.map((ev) => [ev.eventId, ev]))

  const doneCount = eventCompletions.length
  const skippedCount = eventSkips.length
  const swappedCount = eventSwaps.length
  const total = allEvents.length
  const completionPct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const changedEvents = [
    ...eventSkips.map((s) => ({ ...s, kind: 'skipped' })),
    ...eventSwaps.map((s) => ({ ...s, kind: 'swapped' })),
  ].sort((a, b) => (eventById.get(a.eventId)?.date || '').localeCompare(eventById.get(b.eventId)?.date || ''))

  const balances = computeBalances(expenses, members)
  const settleUp = simplifyDebts(balances)

  const isCompleted = !!trip?.completedAt

  if (loadError) {
    return (
      <AppShell>
        <div className="error-banner">{loadError}</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="itin-head">
        <div>
          <div className="eyebrow plan-badge">
            <Icon name="sparkle" />
            Recap
          </div>
          <h1 className="page-title" style={{ marginTop: 4 }}>{trip?.name || 'Loading…'}</h1>
        </div>
        {isCompleted && (
          <div className="itin-actions">
            <button className="btn small ghost" type="button" onClick={handleReopen} disabled={isReopening}>
              <Icon name="refresh" />
              {isReopening ? 'Reopening…' : 'Reopen trip'}
            </button>
          </div>
        )}
      </div>

      <TripTabs tripId={tripId} active="recap" showToday showRecap />

      {loading && (
        <div className="panel glass" style={{ padding: 24 }}>
          <p className="eyebrow">Loading…</p>
        </div>
      )}

      {!loading && trip && (
        <>
          {actionError && <div className="error-banner">{actionError}</div>}

          {!isCompleted && (
            <div className="panel glass generating-panel">
              <p className="q-title">This trip isn't marked complete yet</p>
              <p className="q-sub">
                {trip.endDate ? `Planned through ${fmtDate(trip.endDate)}. ` : ''}
                Close it out to lock in the recap below and ask the group how it went.
              </p>
              <button className="btn accent" type="button" onClick={handleComplete} disabled={isCompleting}>
                <Icon name="flag" />
                {isCompleting ? 'Marking complete…' : 'Mark trip complete'}
              </button>
            </div>
          )}

          {latestPlan && (
            <div className="panel glass" style={{ marginBottom: 16 }}>
              <div className="section-title">
                <h2>What actually happened</h2>
              </div>
              <div className="recap-stats">
                <div className="recap-stat done">
                  <div className="num">{doneCount}</div>
                  <div className="label">Done</div>
                </div>
                <div className="recap-stat skipped">
                  <div className="num">{skippedCount}</div>
                  <div className="label">Skipped</div>
                </div>
                <div className="recap-stat swapped">
                  <div className="num">{swappedCount}</div>
                  <div className="label">Did instead</div>
                </div>
                <div className="recap-stat">
                  <div className="num">{total}</div>
                  <div className="label">Planned</div>
                </div>
              </div>
              <div className="recap-bar-track">
                <div className="recap-bar-fill" style={{ width: `${completionPct}%` }} />
              </div>
              <p className="q-sub" style={{ marginTop: 6, marginBottom: 0 }}>
                {completionPct}% of the planned itinerary marked done.
              </p>
            </div>
          )}

          {changedEvents.length > 0 && (
            <div className="panel glass" style={{ marginBottom: 16 }}>
              <div className="section-title">
                <h2>What we did differently</h2>
              </div>
              <StaggerContainer>
                <StaggerItem className="day-block">
                  {changedEvents.map((c) => {
                    const ev = eventById.get(c.eventId)
                    return (
                      <div className="event" key={c.eventId}>
                        <span className="event-node">
                          <Icon name={c.kind === 'swapped' ? 'refresh' : 'x'} />
                        </span>
                        <div className="event-body">
                          <div className="time mono">{ev?.date}</div>
                          <div className="desc">
                            {ev?.title || 'A planned event'}
                            <span className="event-cost mono">{c.kind === 'swapped' ? 'did instead' : 'skipped'}</span>
                          </div>
                          {c.note && <div className="note">"{c.note}"</div>}
                        </div>
                      </div>
                    )
                  })}
                </StaggerItem>
              </StaggerContainer>
            </div>
          )}

          {expenses.length > 0 && (
            <div className="panel glass" style={{ marginBottom: 16 }}>
              <div className="section-title">
                <h2>Final settle-up</h2>
              </div>
              {settleUp.length === 0 ? (
                <p className="q-sub">Everyone's settled up.</p>
              ) : (
                settleUp.map((t, i) => (
                  <div className="anchor-row" key={i}>
                    <span className="icon-badge">
                      <Icon name="wallet" />
                    </span>
                    <span>
                      {memberLabel(t.from)} {verbFor(t.from, 'owes', 'owe')} {memberLabel(t.to)} {fmtMoney(t.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="panel glass">
            <div className="section-title">
              <h2>How'd it go?</h2>
            </div>

            {feedback.filter((f) => f.userId !== user?.userId).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {feedback
                  .filter((f) => f.userId !== user?.userId)
                  .map((f) => (
                    <div className="anchor-row" key={f.userId}>
                      <span className="icon-badge">
                        <Icon name={MOOD_ICON[f.mood] || 'sparkle'} />
                      </span>
                      <span>
                        {memberLabel(f.userId)} — {MOOD_LABEL[f.mood] || f.mood}
                        {f.comment && <>: "{f.comment}"</>}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {feedbackError && <div className="error-banner">{feedbackError}</div>}

            <form onSubmit={handleSubmitFeedback}>
              <div className="field">
                <label>Your take</label>
                <div className="chip-grid">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      className="chip"
                      aria-pressed={mood === m.value}
                      onClick={() => setMood(m.value)}
                    >
                      <Icon name={m.icon} /> {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="recapComment">Anything to remember for next time?</label>
                <div className="field-input">
                  <Icon name="chat" />
                  <input
                    id="recapComment"
                    placeholder="Optional"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
              </div>
              <div className="q-actions">
                <button type="submit" className="btn accent" disabled={!mood || isSubmittingFeedback}>
                  {isSubmittingFeedback ? 'Saving…' : 'Save feedback'}
                  <Icon name="check" />
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </AppShell>
  )
}
