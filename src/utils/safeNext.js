// Login/Register both read a `next` query param (set by ProtectedRoute) and
// pass it straight to navigate()/<Link to>. That's a classic open-redirect
// vector — a crafted link like /login?next=//evil.com or /login?next=/\evil.com
// could send an authenticated user somewhere outside the app. Only accept a
// genuine same-origin relative path; anything else falls back to "/".
export function safeNextPath(value) {
  if (!value) return null
  if (!/^\/(?!\/|\\)/.test(value) || value.includes('://')) return null
  return value
}
