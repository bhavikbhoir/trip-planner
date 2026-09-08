import { Component } from 'react'

// Top-level safety net: without this, any render-time exception anywhere in
// the tree unmounts the whole app and leaves a real user staring at a blank
// white page with no way back in except guessing to hit reload. Deliberately
// a plain class component (React only supports error boundaries that way)
// and deliberately outside the router/auth tree in main.jsx, so a bug in
// either of those is caught too — which also means it can't use router
// hooks or auth context in its own fallback UI.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Swap this for a real error-tracking service (Sentry, etc.) before
    // launch — right now a crash is only visible in whoever hit it's own
    // browser console, which means you likely won't hear about it.
    console.error('Unhandled error caught by ErrorBoundary:', error, info)
  }

  handleReload = () => {
    window.location.assign('/')
  }

  handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="error-boundary">
        <div className="panel glass error-boundary-card">
          <p className="eyebrow">Manifest</p>
          <h1>Something went wrong</h1>
          <p>
            This page hit an unexpected error. Nothing you've already saved was affected —
            reloading will get you back to your trips.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="error-boundary-detail">
              {String(this.state.error.stack || this.state.error.message || this.state.error)}
            </pre>
          )}
          <div className="error-boundary-actions">
            <button className="btn accent" type="button" onClick={this.handleReload}>
              Reload
            </button>
            <button className="btn ghost" type="button" onClick={this.handleRetry}>
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }
}
