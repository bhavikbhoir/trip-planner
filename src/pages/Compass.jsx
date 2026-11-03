import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../utils/api'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import './pages.scss'

// No draftId in the URL means "start a new conversation" — create one on
// the backend, then swap the URL to /compass/:draftId (replace, not push)
// so a refresh resumes the same draft instead of silently starting another.
export default function Compass() {
  const { draftId } = useParams()
  const navigate = useNavigate()
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [input, setInput] = useState('')
  const [sendError, setSendError] = useState('')
  const [isSending, setIsSending] = useState(false)

  const threadRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function start() {
      setLoading(true)
      setLoadError('')
      try {
        if (draftId) {
          const res = await api.get(`/drafts/${draftId}`)
          if (!cancelled) setDraft(res.draft)
        } else {
          const res = await api.post('/drafts', {})
          if (!cancelled) {
            setDraft(res.draft)
            navigate(`/compass/${res.draft.draftId}`, { replace: true })
          }
        }
      } catch (e) {
        if (!cancelled) setLoadError(e.message || 'Could not start Compass.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    start()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId])

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [draft?.messages.length])

  async function handleSend(e) {
    e.preventDefault()
    const content = input.trim()
    if (!content || isSending || !draft) return

    setSendError('')
    setIsSending(true)
    try {
      const res = await api.post(`/drafts/${draft.draftId}/messages`, { content })
      setDraft(res.draft)
      setInput('')
    } catch (err) {
      // The message stays in the input on failure — nothing was sent, so
      // there's nothing to retype.
      setSendError(err.message || "Compass couldn't reply just now — try again.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AppShell>
      <div className="page-head">
        <h1>Compass</h1>
      </div>

      {loading && (
        <div className="panel glass" style={{ padding: 24 }}>
          <p className="eyebrow">Finding your bearings…</p>
        </div>
      )}

      {!loading && loadError && <div className="error-banner">{loadError}</div>}

      {!loading && !loadError && draft && (
        <div className="compass-shell panel glass">
          <div className="compass-thread" ref={threadRef}>
            {draft.messages.length === 0 && (
              <div className="compass-bubble assistant">
                Where are you thinking of going, or do you want to figure that out together? Tell me roughly when
                and how long you've got, and we'll go from there.
              </div>
            )}
            {draft.messages.map((m, i) => (
              <div className={`compass-bubble ${m.role}`} key={i}>
                {m.content}
              </div>
            ))}
            {isSending && (
              <div className="compass-bubble assistant pending">
                <span className="compass-dot" />
                <span className="compass-dot" />
                <span className="compass-dot" />
              </div>
            )}
          </div>

          {sendError && <div className="error-banner compass-error">{sendError}</div>}

          <form className="compass-input-row" onSubmit={handleSend}>
            <div className="field-input compass-field">
              <Icon name="compass" />
              <input
                type="text"
                placeholder="Tell Compass what you're thinking…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isSending}
                aria-label="Message Compass"
              />
            </div>
            <button className="btn accent small" type="submit" disabled={isSending || !input.trim()}>
              <Icon name="route" />
              Send
            </button>
          </form>
        </div>
      )}
    </AppShell>
  )
}
