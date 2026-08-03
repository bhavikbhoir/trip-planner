import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import './pages.scss'

export default function Settings() {
  const { user, updateDisplayName } = useAuth()
  const [name, setName] = useState(user?.displayName || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

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
    </AppShell>
  )
}
