import { describe, it, expect } from 'vitest'
import { safeNextPath } from './safeNext'

describe('safeNextPath', () => {
  it('accepts a genuine same-origin relative path', () => {
    expect(safeNextPath('/trip/abc123/itinerary')).toBe('/trip/abc123/itinerary')
  })

  it('returns null for an empty or missing value', () => {
    expect(safeNextPath('')).toBeNull()
    expect(safeNextPath(null)).toBeNull()
    expect(safeNextPath(undefined)).toBeNull()
  })

  it('rejects protocol-relative redirects', () => {
    expect(safeNextPath('//evil.com')).toBeNull()
  })

  it('rejects backslash-prefixed redirects', () => {
    expect(safeNextPath('/\\evil.com')).toBeNull()
  })

  it('rejects any value containing a scheme', () => {
    expect(safeNextPath('https://evil.com')).toBeNull()
    expect(safeNextPath('/redirect?to=https://evil.com')).toBeNull()
    expect(safeNextPath('javascript://evil.com')).toBeNull()
  })

  it('rejects a path that does not start with a single slash', () => {
    expect(safeNextPath('evil.com')).toBeNull()
    expect(safeNextPath('trip/abc')).toBeNull()
  })
})
