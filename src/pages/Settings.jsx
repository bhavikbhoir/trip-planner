import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import './pages.scss'

const TRAVEL_STYLES = [
  { value: 'solo', label: 'Solo' },
  { value: 'couple', label: 'Couple' },
  { value: 'family', label: 'Family' },
  { value: 'friends', label: 'Friends' },
]
const INTERESTS = ['Hiking & nature', 'Museums & culture', 'Beaches', 'Nightlife', 'Shopping']

export default function Settings() {
  const { user, updateDisplayName, updateWeatherUnit, updateTravelProfile } = useAuth()
  const [name, setName] = useState(user?.displayName || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const weatherUnit = user?.weatherUnit || 'imperial'
  const travelProfile = user?.travelProfile || {}
  const interests = travelProfile.interests || []

  // Account prefs load async (see syncAccountPrefs), so the first render
  // or two can land before travelProfile.homeBase actually arrives —
  // local state needs to pick up that later value, not just read it once.
  const [homeBase, setHomeBase] = useState(travelProfile.homeBase || '')
  useEffect(() => {
    setHomeBase(travelProfile.homeBase || '')
  }, [travelProfile.homeBase])

  function toggleInterest(value) {
    const next = interests.includes(value) ? interests.filter((i) => i !== value) : [...interests, value]
    updateTravelProfile({ interests: next })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setIsSaving(true)
    try {
      await updateDisplayName(name)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message || 'Could not update your name.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="page-head">
        <h1>Settings</h1>
      </div>

      <form className="panel glass" onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label htmlFor="settingsName">Display name</label>
          <div className="field-input">
            <Icon name="users" />
            <input id="settingsName" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <p className="q-sub" style={{ marginTop: 6 }}>
            Shown to other trip members — on trips you're already part of, and on any new trip you create or join.
          </p>
        </div>

        <div className="q-actions">
          <button className="btn accent" type="submit" disabled={isSaving || !name.trim()}>
            <Icon name="check" />
            {isSaving ? 'Saving…' : saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </form>

      <div className="panel glass" style={{ maxWidth: 420, marginTop: 16 }}>
        <div className="field">
          <label>Temperature units</label>
          <div className="chip-grid">
            <button
              type="button"
              className="chip"
              aria-pressed={weatherUnit === 'imperial'}
              onClick={() => updateWeatherUnit('imperial')}
            >
              °F
            </button>
            <button
              type="button"
              className="chip"
              aria-pressed={weatherUnit === 'metric'}
              onClick={() => updateWeatherUnit('metric')}
            >
              °C
            </button>
          </div>
          <p className="q-sub" style={{ marginTop: 6 }}>
            Applies to weather shown on any trip you're part of.
          </p>
        </div>
      </div>

      <div className="panel glass" style={{ maxWidth: 420, marginTop: 16 }}>
        <div className="field">
          <label htmlFor="settingsHomeBase">Usually traveling from</label>
          <div className="field-input">
            <Icon name="pin" />
            <input
              id="settingsHomeBase"
              placeholder="e.g. Chicago, IL"
              value={homeBase}
              onChange={(e) => setHomeBase(e.target.value)}
              onBlur={() => {
                if (homeBase !== (travelProfile.homeBase || '')) updateTravelProfile({ homeBase: homeBase.trim() })
              }}
            />
          </div>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label>Usually traveling</label>
          <div className="chip-grid">
            {TRAVEL_STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                className="chip"
                aria-pressed={travelProfile.travelStyle === s.value}
                onClick={() => updateTravelProfile({ travelStyle: travelProfile.travelStyle === s.value ? null : s.value })}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label>Usually into</label>
          <div className="chip-grid">
            {INTERESTS.map((i) => (
              <button
                key={i}
                type="button"
                className="chip"
                aria-pressed={interests.includes(i)}
                onClick={() => toggleInterest(i)}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <p className="q-sub" style={{ marginTop: 10 }}>
          Compass uses this so it doesn't have to ask every time — it's a starting point, not a rule, so any of it's
          easy to change per trip.
        </p>
      </div>
    </AppShell>
  )
}
