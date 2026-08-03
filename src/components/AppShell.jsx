import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/api'

const POLL_MS = 40000

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

const NOTIF_ICONS = { member_joined: 'users', suggestion_added: 'chat', plan_generated: 'sparkle' }

// `type` is extensible — unrecognized types fall back to a generic label and
// icon rather than rendering nothing.
function notificationLabel(n) {
  if (n.type === 'member_joined') {
    return (
      <>
        <b>{n.actorDisplayName}</b> joined <b>{n.tripName}</b>
      </>
    )
  }
  if (n.type === 'suggestion_added') {
    return (
      <>
        <b>{n.actorDisplayName}</b> suggested a change on <b>{n.tripName}</b>
      </>
    )
  }
  if (n.type === 'plan_generated') {
    return (
      <>
        <b>{n.actorDisplayName}</b> regenerated the plan for <b>{n.tripName}</b> — needs your approval
      </>
    )
  }
  return n.tripName
}

// Shared topbar (brand mark + notifications + optional page actions) for
// every screen, authenticated or not. The ambient canvas + icon sprite mount
// once at the App root, not here.
export default function AppShell({ actions, children }) {
  const { isDemo, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const wrapRef = useRef(null)

  async function loadNotifications() {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.notifications || [])
      setUnreadCount(res.unreadCount || 0)
    } catch {
      // Best-effort — a notifications hiccup shouldn't break the rest of the app.
    }
  }

  useEffect(() => {
    loadNotifications()
    const id = setInterval(loadNotifications, POLL_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleToggle() {
    const next = !isOpen
    setIsOpen(next)
    if (next && unreadCount > 0) {
      setUnreadCount(0)
      setNotifications((list) => list.map((n) => ({ ...n, read: true })))
      try {
        await api.post('/notifications/mark-read')
      } catch {
        // Best-effort — worst case the badge reappears on the next poll.
      }
    }
  }

  function handleSelect(n) {
    setIsOpen(false)
    navigate(`/trip/${n.tripId}/itinerary`)
  }

  async function handleExitDemo() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Icon name="compass" />
          </span>
          Manifest
        </Link>
        <div className="topbar-actions">
          {isDemo && (
            <span className="demo-badge">
              <span className="dot" />
              Demo · <button type="button" onClick={handleExitDemo}>Exit</button>
            </span>
          )}
          <div className="notif-wrap" ref={wrapRef}>
            <button type="button" className="icon-btn notif-bell" onClick={handleToggle} aria-label="Notifications">
              <Icon name="bell" />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {isOpen && (
              <div className="notif-panel">
                <div className="notif-panel-head">Notifications</div>
                {notifications.length === 0 && <div className="notif-empty">Nothing yet — invite some friends.</div>}
                {notifications.map((n) => (
                  <button
                    type="button"
                    key={n.notificationId}
                    className={`notif-item${n.read ? '' : ' unread'}`}
                    onClick={() => handleSelect(n)}
                  >
                    <span className="notif-icon">
                      <Icon name={NOTIF_ICONS[n.type] || 'bell'} />
                    </span>
                    <span className="notif-text">
                      <span className="notif-label">{notificationLabel(n)}</span>
                      <span className="notif-time">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link className="icon-btn" to="/settings" aria-label="Settings">
            <Icon name="sliders" />
          </Link>
          {actions}
        </div>
      </header>
      {children}
    </div>
  )
}
