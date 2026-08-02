import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import { panelVariants } from '../components/motion'
import './pages.scss'

const STEPS = ['food', 'activities', 'budgetPace', 'groupDynamics', 'likes', 'logistics']

const OPTIONS = {
  food: ['Local street food', 'Fine dining', 'Vegetarian-friendly', 'Cafes & coffee', 'No seafood'],
  activities: ['Hiking & nature', 'Museums & culture', 'Beaches', 'Nightlife', 'Shopping'],
  budgetPace: ['Budget', 'Mid-range', 'Splurge', 'Relaxed pace', 'Packed schedule'],
  groupDynamics: ['Ages 25–35', 'Traveling with kids', 'Mixed fitness levels', 'Early risers'],
}

function toggleValue(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function ChipGroup({ options, selected, onToggle }) {
  return (
    <div className="chip-grid">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className="chip"
          aria-pressed={selected.includes(opt)}
          onClick={() => onToggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function Preferences() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [trip, setTrip] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [food, setFood] = useState([])
  const [activities, setActivities] = useState([])
  const [budgetPace, setBudgetPace] = useState([])
  const [groupDynamics, setGroupDynamics] = useState([])
  const [companions, setCompanions] = useState([])
  const [dislikes, setDislikes] = useState('')
  const [mustDo, setMustDo] = useState('')
  const [arrivalFlight, setArrivalFlight] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  const [departureFlight, setDepartureFlight] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [transportMode, setTransportMode] = useState('')
  const [seatsAvailable, setSeatsAvailable] = useState('')

  useEffect(() => {
    api
      .get(`/trips/${tripId}`)
      .then((res) => {
        setTrip(res.trip)
        const mine = res.members?.find((m) => m.userId === user?.userId)
        if (mine?.preferences) {
          setFood(mine.preferences.food || [])
          setActivities(mine.preferences.activities || [])
          setBudgetPace(mine.preferences.budgetPace || [])
          setGroupDynamics(mine.preferences.groupDynamics || [])
          setDislikes(mine.preferences.dislikes || '')
          setMustDo(mine.preferences.mustDo || '')
        }
        if (mine?.companions?.length) setCompanions(mine.companions)
        const myLogistics = res.logistics?.find((l) => l.userId === user?.userId)
        if (myLogistics?.arrival) {
          setArrivalFlight(myLogistics.arrival.flight || '')
          setArrivalTime(myLogistics.arrival.datetime || '')
        }
        if (myLogistics?.departure) {
          setDepartureFlight(myLogistics.departure.flight || '')
          setDepartureTime(myLogistics.departure.datetime || '')
        }
        if (myLogistics?.transportMode) setTransportMode(myLogistics.transportMode)
        if (myLogistics?.seatsAvailable != null) setSeatsAvailable(String(myLogistics.seatsAvailable))
      })
      .catch((err) => setLoadError(err.message || 'Could not load this trip.'))
  }, [tripId, user])

  function goNext() {
    setDirection(1)
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }
  function goBack() {
    setDirection(-1)
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  function addCompanion() {
    setCompanions((c) => [...c, { name: '', age: '' }])
  }
  function updateCompanion(idx, field, value) {
    setCompanions((c) => c.map((row, i) => (i === idx ? { ...row, [field]: value } : row)))
  }
  function removeCompanion(idx) {
    setCompanions((c) => c.filter((_, i) => i !== idx))
  }

  async function handleFinish() {
    setSubmitError('')
    setIsSubmitting(true)
    try {
      await api.patch(`/trips/${tripId}/members/me`, {
        preferences: { food, activities, budgetPace, groupDynamics, dislikes, mustDo },
        companions: companions.filter((c) => c.name.trim()),
      })
      if (arrivalFlight || arrivalTime || departureFlight || departureTime || transportMode) {
        await api.put(`/trips/${tripId}/logistics/me`, {
          arrival: arrivalFlight || arrivalTime ? { flight: arrivalFlight, datetime: arrivalTime } : null,
          departure: departureFlight || departureTime ? { flight: departureFlight, datetime: departureTime } : null,
          transportMode: transportMode || undefined,
          seatsAvailable: transportMode === 'driving' && seatsAvailable ? Number(seatsAvailable) : undefined,
        })
      }
      navigate(`/trip/${tripId}/itinerary`)
    } catch (err) {
      setSubmitError(err.message || 'Could not save your preferences — you can try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const pct = (stepIndex / (STEPS.length - 1)) * 100
  const eff = 8 + pct * 0.84

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
        <Link className="btn ghost small" to="/">
          <Icon name="compass" />
          Dashboard
        </Link>
      }
    >
      <div className="panel glass" style={{ maxWidth: 580 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          {trip ? `Preferences · ${trip.name}` : 'Loading…'}
        </div>

        <div className="flight-track">
          <div className="rail" />
          <div className="rail-fill" style={{ width: `${eff - 8}%` }} />
          <div className="plane-marker" style={{ left: `${eff}%` }}>
            <Icon name="plane" />
          </div>
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`step-node ${i <= stepIndex ? 'done' : ''}`}
              style={{ left: `${8 + (i / (STEPS.length - 1)) * 100 * 0.84}%` }}
            />
          ))}
        </div>

        {submitError && <div className="error-banner">{submitError}</div>}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={stepIndex}
            custom={direction}
            variants={panelVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {STEPS[stepIndex] === 'food' && (
              <>
                <div className="q-eyebrow">
                  <Icon name="fork" />
                  <span className="eyebrow">Food</span>
                </div>
                <div className="q-title">What are you into eating?</div>
                <div className="q-sub">Pick as many as apply — this shapes where the AI books meals.</div>
                <ChipGroup options={OPTIONS.food} selected={food} onToggle={(v) => setFood((f) => toggleValue(f, v))} />
              </>
            )}

            {STEPS[stepIndex] === 'activities' && (
              <>
                <div className="q-eyebrow">
                  <Icon name="mountain" />
                  <span className="eyebrow">Activities</span>
                </div>
                <div className="q-title">What kind of spots?</div>
                <div className="q-sub">Activities and places you want on the itinerary.</div>
                <ChipGroup
                  options={OPTIONS.activities}
                  selected={activities}
                  onToggle={(v) => setActivities((a) => toggleValue(a, v))}
                />
              </>
            )}

            {STEPS[stepIndex] === 'budgetPace' && (
              <>
                <div className="q-eyebrow">
                  <Icon name="wallet" />
                  <span className="eyebrow">Budget &amp; pace</span>
                </div>
                <div className="q-title">How should this feel?</div>
                <div className="q-sub">Roughly how you want the trip to run.</div>
                <ChipGroup
                  options={OPTIONS.budgetPace}
                  selected={budgetPace}
                  onToggle={(v) => setBudgetPace((b) => toggleValue(b, v))}
                />
              </>
            )}

            {STEPS[stepIndex] === 'groupDynamics' && (
              <>
                <div className="q-eyebrow">
                  <Icon name="users" />
                  <span className="eyebrow">Group dynamics</span>
                </div>
                <div className="q-title">Who's coming?</div>
                <div className="q-sub">Helps the AI pick appropriate activities.</div>
                <ChipGroup
                  options={OPTIONS.groupDynamics}
                  selected={groupDynamics}
                  onToggle={(v) => setGroupDynamics((g) => toggleValue(g, v))}
                />

                <div className="q-eyebrow" style={{ marginTop: 6 }}>
                  <Icon name="baby" />
                  <span className="eyebrow">Bringing anyone else?</span>
                </div>
                <div className="q-sub" style={{ marginBottom: 12 }}>
                  +1s who won't create an account — partner, kids, parents. Ages help the AI keep pacing and stops
                  age-appropriate.
                </div>
                <div className="companion-list">
                  {companions.map((c, idx) => (
                    <div className="companion-row" key={idx}>
                      <div className="field-input">
                        <Icon name="users" />
                        <input
                          type="text"
                          placeholder="Name"
                          value={c.name}
                          onChange={(e) => updateCompanion(idx, 'name', e.target.value)}
                        />
                      </div>
                      <div className="field-input age">
                        <input
                          type="number"
                          placeholder="Age"
                          min="0"
                          max="120"
                          value={c.age}
                          onChange={(e) => updateCompanion(idx, 'age', e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Remove companion"
                        onClick={() => removeCompanion(idx)}
                      >
                        <Icon name="x" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" className="btn small ghost add-companion-btn" onClick={addCompanion}>
                  <Icon name="plus" />
                  Add companion
                </button>
              </>
            )}

            {STEPS[stepIndex] === 'likes' && (
              <>
                <div className="q-eyebrow">
                  <Icon name="heart" />
                  <span className="eyebrow">Likes &amp; dislikes</span>
                </div>
                <div className="q-title">Anything to avoid?</div>
                <div className="q-sub">Free text — the more specific, the better the plan.</div>
                <div className="field">
                  <label htmlFor="dislikes">Dislikes / avoid</label>
                  <div className="field-input">
                    <Icon name="heart" />
                    <input
                      id="dislikes"
                      type="text"
                      placeholder="e.g. Long car rides, very spicy food"
                      value={dislikes}
                      onChange={(e) => setDislikes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="mustDo">Must-do if possible</label>
                  <div className="field-input">
                    <Icon name="sparkle" />
                    <input
                      id="mustDo"
                      type="text"
                      placeholder="e.g. Sunrise trek, at least one beach day"
                      value={mustDo}
                      onChange={(e) => setMustDo(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {STEPS[stepIndex] === 'logistics' && (
              <>
                <div className="q-eyebrow" style={{ marginTop: 6 }}>
                  <Icon name="car" />
                  <span className="eyebrow">Getting around</span>
                </div>
                <div className="q-sub" style={{ marginBottom: 12 }}>
                  Are you driving, or do you need a ride once you're there?
                </div>
                <div className="chip-grid">
                  {[
                    { value: 'driving', label: 'Driving myself' },
                    { value: 'need_ride', label: 'Need a ride' },
                    { value: 'not_driving', label: 'Not driving' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className="chip"
                      aria-pressed={transportMode === opt.value}
                      onClick={() => setTransportMode((m) => (m === opt.value ? '' : opt.value))}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="q-eyebrow" style={{ marginTop: 18 }}>
                  <Icon name="plane" />
                  <span className="eyebrow">Your logistics</span>
                </div>
                <div className="q-title">
                  {transportMode === 'driving' ? 'When do you plan to arrive / need to leave?' : 'When do you land / leave?'}
                </div>
                <div className="q-sub">This anchors the itinerary to when you're actually there.</div>
                <div className="row2">
                  <div className="field">
                    <label htmlFor="arrivalFlight">{transportMode === 'driving' ? 'Notes (optional)' : 'Arrival flight'}</label>
                    <div className="field-input">
                      <Icon name={transportMode === 'driving' ? 'car' : 'plane'} />
                      <input
                        id="arrivalFlight"
                        type="text"
                        placeholder={transportMode === 'driving' ? 'e.g. taking the scenic route' : 'e.g. GA 412'}
                        value={arrivalFlight}
                        onChange={(e) => setArrivalFlight(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="arrivalTime">{transportMode === 'driving' ? 'Arrive by' : 'Arrival time'}</label>
                    <div className="field-input">
                      <Icon name="clock" />
                      <input
                        id="arrivalTime"
                        type="datetime-local"
                        value={arrivalTime}
                        onChange={(e) => setArrivalTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="row2">
                  <div className="field">
                    <label htmlFor="departureFlight">{transportMode === 'driving' ? 'Notes (optional)' : 'Departure flight'}</label>
                    <div className="field-input">
                      <Icon name={transportMode === 'driving' ? 'car' : 'plane'} />
                      <input
                        id="departureFlight"
                        type="text"
                        placeholder={transportMode === 'driving' ? 'e.g. stopping overnight on the way back' : 'e.g. GA 415'}
                        value={departureFlight}
                        onChange={(e) => setDepartureFlight(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="departureTime">{transportMode === 'driving' ? 'Need to leave by' : 'Departure time'}</label>
                    <div className="field-input">
                      <Icon name="clock" />
                      <input
                        id="departureTime"
                        type="datetime-local"
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                {transportMode === 'driving' && (
                  <div className="field">
                    <label htmlFor="seatsAvailable">Seats available for others</label>
                    <div className="field-input">
                      <Icon name="users" />
                      <input
                        id="seatsAvailable"
                        type="number"
                        min="0"
                        max="8"
                        placeholder="e.g. 2"
                        value={seatsAvailable}
                        onChange={(e) => setSeatsAvailable(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="q-actions">
          <button className="btn ghost" type="button" onClick={goBack} disabled={stepIndex === 0}>
            Back
          </button>
          {stepIndex < STEPS.length - 1 ? (
            <button className="btn accent" type="button" onClick={goNext}>
              Next
              <Icon name="plane" />
            </button>
          ) : (
            <button className="btn accent" type="button" onClick={handleFinish} disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Finish'}
              <Icon name="check" />
            </button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
