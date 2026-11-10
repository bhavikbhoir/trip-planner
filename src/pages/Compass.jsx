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
//
// A reply that got cut off mid-sentence (hitting the token cap) can end
// with a single unpaired ** instead of a closing one — strip it rather
// than show the user a stray pair of asterisks that was never meant to
// be visible markup.
function renderInline(text) {
  const markerCount = (text.match(/\*\*/g) || []).length
  const clean = markerCount % 2 === 1 ? text.replace(/\*\*(?!.*\*\*)/s, '') : text

  return clean.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// Mirrors MAX_USER_TURNS in trip-planner-api's functions/drafts/sendMessage.js —
// keep the two in sync if that cap ever changes.
const MAX_USER_TURNS = 24

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
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
  const [isContinuing, setIsContinuing] = useState(false)

  const [input, setInput] = useState('')
  const [sendError, setSendError] = useState('')
  const [isSending, setIsSending] = useState(false)

  const [threads, setThreads] = useState([])
  const [threadsLoading, setThreadsLoading] = useState(false)
  const [showThreads, setShowThreads] = useState(false)

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
    setShowThreads(false)
    setIsStartingNew(true)
    setLoadError('')
    try {
      const res = await api.post('/drafts', {})
      setDraft(res.draft)
      isFirstScroll.current = true
      navigate(`/compass/${res.draft.draftId}`)
    } catch (e) {
      setLoadError(e.message || 'Could not start a new conversation.')
    } finally {
      setIsStartingNew(false)
    }
  }

  // Starts a new draft that carries a short summary of this one forward
  // (see POST /drafts' sourceDraftId), instead of a blank slate — the
  // option offered once a conversation's hit its turn cap, and available
  // any time from the Conversations panel.
  async function handleContinueWithContext() {
    if (!draft) return
    setShowThreads(false)
    setIsContinuing(true)
    setLoadError('')
    try {
      const res = await api.post('/drafts', { sourceDraftId: draft.draftId })
      setDraft(res.draft)
      isFirstScroll.current = true
      navigate(`/compass/${res.draft.draftId}`)
    } catch (e) {
      setLoadError(e.message || 'Could not continue that conversation.')
    } finally {
      setIsContinuing(false)
    }
  }

  async function toggleThreads() {
    if (!showThreads) {
      setThreadsLoading(true)
      try {
        const res = await api.get('/drafts')
        setThreads(res.drafts || [])
      } catch {
        setThreads([])
      } finally {
        setThreadsLoading(false)
      }
    }
    setShowThreads((s) => !s)
  }

  function openThread(id) {
    setShowThreads(false)
    if (id === draft?.draftId) return
    isFirstScroll.current = true
    navigate(`/compass/${id}`)
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

  // Grows the textarea with what's typed instead of scrolling a single
  // line sideways, up to a cap — past that it scrolls internally rather
  // than pushing the send button off-screen. Resets to one line once the
  // field clears (e.g. right after sending).
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  const userTurns = draft?.messages.filter((m) => m.role === 'user').length ?? 0
  const turnsRemaining = MAX_USER_TURNS - userTurns
  const capReached = turnsRemaining <= 0

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
          <div className="compass-threads-wrap">
            <button className="btn ghost small" type="button" onClick={toggleThreads} aria-expanded={showThreads}>
              <Icon name="chat" />
              Conversations
            </button>
            {showThreads && (
              <div className="compass-threads-panel">
                <button
                  className="compass-thread-new"
                  type="button"
                  onClick={handleStartNew}
                  disabled={isStartingNew || isContinuing}
                >
                  <Icon name="plus" />
                  New conversation
                </button>
                {draft.messages.length > 0 && (
                  <button
                    className="compass-thread-new"
                    type="button"
                    onClick={handleContinueWithContext}
                    disabled={isStartingNew || isContinuing}
                  >
                    <Icon name="route" />
                    {isContinuing ? 'Carrying context…' : 'Continue with context'}
                  </button>
                )}
                {threadsLoading && <p className="compass-threads-empty">Loading…</p>}
                {!threadsLoading && threads.length === 0 && (
                  <p className="compass-threads-empty">No past conversations yet.</p>
                )}
                {!threadsLoading &&
                  threads.map((t) => (
                    <button
                      key={t.draftId}
                      type="button"
                      className={`compass-thread-item${t.draftId === draft.draftId ? ' active' : ''}`}
                      onClick={() => openThread(t.draftId)}
                    >
                      <span className="compass-thread-title">{t.firstMessage || 'New conversation'}</span>
                      <span className="compass-thread-time">{timeAgo(t.updatedAt)}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
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
            {draft.carriedSummary && (
              <div className="compass-carried">
                <Icon name="route" />
                <div>
                  <p className="compass-carried-label">Picked up from your last conversation</p>
                  <p className="compass-carried-text">{renderInline(draft.carriedSummary)}</p>
                </div>
              </div>
            )}
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

          {capReached ? (
            <div className="compass-cap-row">
              <p className="compass-cap-text">This conversation's reached its limit — start fresh to keep going.</p>
              <div className="compass-cap-actions">
                <button className="btn ghost small" type="button" onClick={handleStartNew} disabled={isStartingNew || isContinuing}>
                  New conversation
                </button>
                <button
                  className="btn accent small"
                  type="button"
                  onClick={handleContinueWithContext}
                  disabled={isStartingNew || isContinuing}
                >
                  <Icon name="route" />
                  {isContinuing ? 'Carrying context…' : 'Continue with context'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {turnsRemaining <= 5 && (
                <p className="compass-turns-warning">
                  {turnsRemaining} message{turnsRemaining === 1 ? '' : 's'} left in this conversation.
                </p>
              )}
              <form className="compass-input-row" onSubmit={handleSend}>
                <div className="field-input compass-field">
                  <Icon name="compass" />
                  <textarea
                    ref={inputRef}
                    rows={1}
                    placeholder="Tell Compass what you're thinking…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend(e)
                      }
                    }}
                    disabled={isSending}
                    aria-label="Message Compass"
                  />
                </div>
                <button className="btn accent small" type="submit" disabled={isSending || !input.trim()}>
                  <Icon name="route" />
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </AppShell>
  )
}
