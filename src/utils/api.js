import { isDemoMode, demoRequest } from './demoData'

const BASE_URL = import.meta.env.VITE_API_BASE

let getTokenFn = null
let onAuthErrorFn = null

export function setTokenProvider(fn) {
  getTokenFn = fn
}

export function setAuthErrorHandler(fn) {
  onAuthErrorFn = fn
}

async function request(method, path, body) {
  // Demo mode resolves against local seed data — no network, no Cognito
  // session lookup. See utils/demoData.js.
  if (isDemoMode()) return demoRequest(method, path, body)

  const headers = { 'Content-Type': 'application/json' }

  if (getTokenFn) {
    const token = await getTokenFn()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  const json = text ? JSON.parse(text) : {}

  if (!res.ok) {
    if (res.status === 401 && onAuthErrorFn) onAuthErrorFn()
    // Backend error envelope is `{ error: "message" }` — tolerate `{ error: { message } }` too.
    const message = (typeof json?.error === 'string' ? json.error : json?.error?.message) || 'Request failed'
    const err = new Error(message)
    err.status = res.status
    throw err
  }

  // Backend returns the body directly (e.g. `{ trips: [...] }`), not wrapped in `{ data }`.
  return json
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path, body) => request('DELETE', path, body),
}
