import { Link, useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import { useAuth } from '../contexts/AuthContext'

// Shared topbar (brand mark + optional page actions) for every screen,
// authenticated or not. The ambient canvas + icon sprite mount once at the
// App root, not here.
export default function AppShell({ actions, children }) {
  const { isDemo, logout } = useAuth()
  const navigate = useNavigate()

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
          {actions}
        </div>
      </header>
      {children}
    </div>
  )
}
