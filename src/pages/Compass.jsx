import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../utils/api'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import './pages.scss'

// Haiku formats with markdown (mainly **bold**) even though this renders
// as plain chat bubbles — rather than fight that in the prompt and lose
// genuinely useful structure in longer replies, render the one marker it
// actually uses. Not a general markdown parser, just **bold**.
function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// No draftId in the URL means "open Compass" rather than "start over" —
// resume the most recently active draft if one exists, same as reopening
// any chat app. Only create a brand new draft when there's genuinely
// nothing to resume. Either way the URL gets swapped to /compass/:draftId
// (replace, not push) so a refresh lands on that same draft directly.
export default function Compass() {
  const { draftId } = useParams()
  const navigate = useNavigate()
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isStartingNew, setIsStartingNew] = useState(false)

  const [input, setInput] = useState('')
  const [sendError, setSendError] = useState('')
  const [isSending, setIsSending] = useState(false)

  const threadRef = useRef(null)
  const inputRef = useRef(null)
  const isFirstScroll = useRef(true)

  useEffect(() => {
    let cancelled = false

    async function start() {
      setLoading(true)
      setLoadError('')
      try {
        if (draftId) {
          const res = await api.get(`/drafts/${draftId}`)
          if (!cancelled) setDraft(res.draft)
          return
        }

        // Best-effort — if listing drafts fails for some reason, falling
        // through to start a new one is better than blocking the whole
        // page on a step that isn't the core functionality.
        let resumable = null
        try {
          const list = await api.get('/drafts')
          resumable = (list.drafts || []).find((d) => d.status === 'active') || null
        } catch {
          resumable = null
        }

        if (resumable) {
          const res = await api.get(`/drafts/${resumable.draftId}`)
          if (!cancelled) {
            setDraft(res.draft)
            navigate(`/compass/${resumable.draftId}`, { replace: true })
          }
          return
        }

        const res = await api.post('/drafts', {})
        if (!cancelled) {
          setDraft(res.draft)
          navigate(`/compass/${res.draft.draftId}`, { replace: true })
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

  async function handleStartNew() {
    setIsStartingNew(true)
    setLoadError('')
    try {
      const res = await api.post('/drafts', {})
      setDraft(res.draft)
      isFirstScroll.current = true
      navigate(`/compass/${res.draft.draftId}`, { replace: true })
    } catch (e) {
      setLoadError(e.message || 'Could not start a new conversation.')
    } finally {
      setIsStartingNew(false)
    }
  }

  // Jump instantly to the bottom on first load (a resumed draft shouldn't
  // visibly scroll through its whole history), then smooth-scroll for
  // anything after that — including the typing indicator showing up,
  // which is its own content change, not just new messages landing.
  useEffect(() => {
    if (!threadRef.current) return
    threadRef.current.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: isFirstScroll.current ? 'auto' : 'smooth',
    })
    isFirstScroll.current = false
  }, [draft?.messages.length, isSending])

  // A disabled input loses focus, and it's disabled while a reply is in
  // flight — so without this, every reply lands with focus dropped and
  // the next message needs a click to start typing. Refocus whenever the
  // field becomes typeable again.
  useEffect(() => {
    if (!loading && !isSending) inputRef.current?.focus()
  }, [loading, isSending])

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
        {draft && (
          <button className="btn ghost small" type="button" onClick={handleStartNew} disabled={isStartingNew}>
            <Icon name="plus" />
            Start new conversation
          </button>
        )}
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
                {renderInline(m.content)}
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
                ref={inputRef}
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
