// Manual override on top of the OS/browser `prefers-color-scheme` the app
// already follows by default. Nothing stored yet = keep following the
// system setting; a stored value pins it explicitly. `_theme.scss` already
// has the `data-theme` CSS in place for exactly this.
//
// Local storage is the fast path (read synchronously, pre-paint, in
// index.html) — AuthContext syncs it against the account's real saved
// preference once login resolves, which is why setting it dispatches an
// event: any already-mounted AppShell needs to pick up a value that changed
// out from under it, not just the one it changed itself.
const STORAGE_KEY = 'manifest-theme'
const EVENT = 'manifest-theme-change'

export function getStoredTheme() {
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' ? v : null
}

export function getEffectiveTheme() {
  return getStoredTheme() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

export function setStoredTheme(theme) {
  window.localStorage.setItem(STORAGE_KEY, theme)
  document.documentElement.setAttribute('data-theme', theme)
  window.dispatchEvent(new CustomEvent(EVENT, { detail: theme }))
}

export function onThemeChange(callback) {
  function handler(e) {
    callback(e.detail)
  }
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
