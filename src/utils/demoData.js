// Local, in-memory demo mode — lets the UI be clicked through end-to-end
// with zero backend deployed. Mirrors the exact response shapes trip-planner-api
// returns, so pages need no special-casing (see api.js's `request()` early return).

export const DEMO_STORAGE_KEY = 'tp_demo'
export const DEMO_USER = { userId: 'demo-user', username: 'you@manifest.app' }

export function isDemoMode() {
  return typeof window !== 'undefined' && window.localStorage.getItem(DEMO_STORAGE_KEY) === '1'
}

function notFound() {
  const e = new Error('Trip not found')
  e.status = 404
  return e
}

function badRequest(msg) {
  const e = new Error(msg || 'Not available in demo mode')
  e.status = 400
  return e
}

function nowIso() {
  return new Date().toISOString()
}

function makeInitialStore() {
  return {
    'demo-bali': {
      trip: {
        tripId: 'demo-bali',
        name: 'Bali w/ Crew',
        destination: 'Bali, Indonesia',
        startDate: '2026-11-14',
        endDate: '2026-11-21',
        status: 'planning',
        ownerId: DEMO_USER.userId,
      },
      members: [
        {
          userId: DEMO_USER.userId,
          role: 'owner',
          preferences: {
            food: ['Local street food', 'Vegetarian-friendly'],
            activities: ['Hiking & nature', 'Beaches'],
            budgetPace: ['Mid-range', 'Relaxed pace'],
            groupDynamics: ['Ages 25–35', 'Mixed fitness levels'],
            dislikes: 'Long car rides, very spicy food',
            mustDo: 'Sunrise trek, at least one beach day',
          },
          companions: [],
        },
        {
          userId: 'sam',
          role: 'member',
          preferences: {
            food: ['Fine dining', 'Cafes & coffee'],
            activities: ['Museums & culture', 'Nightlife'],
            budgetPace: ['Splurge'],
            groupDynamics: ['Early risers'],
            dislikes: '',
            mustDo: 'Try the best coffee in Ubud',
          },
          companions: [],
        },
        {
          userId: 'priya',
          role: 'member',
          preferences: {
            food: ['Vegetarian-friendly', 'No seafood'],
            activities: ['Beaches', 'Hiking & nature'],
            budgetPace: ['Mid-range'],
            groupDynamics: ['Traveling with kids'],
            dislikes: 'Seafood',
            mustDo: 'A kid-friendly beach afternoon',
          },
          companions: [{ name: 'Maya', age: 7 }],
        },
        {
          userId: 'jordan',
          role: 'member',
          preferences: {
            food: ['Local street food'],
            activities: ['Hiking & nature', 'Shopping'],
            budgetPace: ['Budget'],
            groupDynamics: ['Traveling with kids', 'Mixed fitness levels'],
            dislikes: '',
            mustDo: '',
          },
          companions: [{ name: 'Leo', age: 10 }],
        },
      ],
      logistics: [
        {
          userId: DEMO_USER.userId,
          arrival: { flight: 'GA 410', datetime: '2026-11-13T11:20:00' },
          departure: { flight: 'GA 417', datetime: '2026-11-21T14:05:00' },
        },
        {
          userId: 'sam',
          arrival: { flight: 'GA 412', datetime: '2026-11-14T09:40:00' },
          departure: { flight: 'GA 415', datetime: '2026-11-21T11:20:00' },
        },
        {
          userId: 'priya',
          arrival: { flight: 'QZ 502', datetime: '2026-11-14T13:15:00' },
          departure: { flight: 'QZ 505', datetime: '2026-11-21T15:00:00' },
        },
        {
          userId: 'jordan',
          arrival: { flight: 'SQ 938', datetime: '2026-11-13T18:05:00' },
          departure: { flight: 'SQ 939', datetime: '2026-11-20T20:30:00' },
        },
      ],
      bookings: [
        {
          bookingId: 'bk-hotel-1',
          type: 'hotel',
          name: 'Ubud Jungle Villas',
          location: 'Ubud, Bali',
          startDatetime: '2026-11-14T15:00:00',
          endDatetime: '2026-11-21T11:00:00',
          confirmation: 'BVL-58213',
          cost: 840,
          addedBy: DEMO_USER.userId,
        },
        {
          bookingId: 'bk-car-1',
          type: 'car',
          name: 'Bali Go Rentals',
          location: 'Ubud, Bali',
          startDatetime: '2026-11-15T09:00:00',
          endDatetime: '2026-11-20T18:00:00',
          confirmation: 'BGR-7741',
          cost: 210,
          addedBy: DEMO_USER.userId,
        },
      ],
      plans: [
        {
          version: 1,
          generatedAt: '2026-07-20T10:00:00Z',
          days: [
            {
              date: 'Nov 14, Sat',
              events: [
                { time: '9:40a', title: 'Sam arrives', icon: 'plane' },
                { time: '1:15p', title: 'Priya arrives', icon: 'plane' },
                { time: '3:00p', title: 'Check in — Ubud Jungle Villas', icon: 'hotel' },
                { time: '6:00p', title: 'Dinner — Warung Sopa', icon: 'food' },
              ],
            },
            {
              date: 'Nov 15, Sun',
              events: [
                { time: '5:30a', title: 'Depart for Mt. Batur sunrise trek', icon: 'car' },
                {
                  time: '9:00a',
                  title: 'Sunrise trek, Mt. Batur',
                  icon: 'activity',
                  note: 'Maya (7) and Leo (10) are on this leg — swapped the summit push for the Kintamani viewpoint (30 min, same sunrise view).',
                },
              ],
            },
          ],
        },
      ],
    },
    'demo-cabin': {
      trip: {
        tripId: 'demo-cabin',
        name: 'Cabin Weekend',
        destination: 'Aspen, Colorado',
        startDate: '2026-08-21',
        endDate: '2026-08-24',
        status: 'finalized',
        ownerId: DEMO_USER.userId,
      },
      members: [
        { userId: DEMO_USER.userId, role: 'owner', preferences: { food: ['Cafes & coffee'], activities: ['Hiking & nature'], budgetPace: ['Mid-range'], groupDynamics: [], dislikes: '', mustDo: '' }, companions: [] },
        { userId: 'sam', role: 'member', preferences: { food: [], activities: ['Nightlife'], budgetPace: [], groupDynamics: [], dislikes: '', mustDo: '' }, companions: [] },
        { userId: 'priya', role: 'member', preferences: { food: [], activities: [], budgetPace: [], groupDynamics: [], dislikes: '', mustDo: '' }, companions: [] },
      ],
      logistics: [],
      bookings: [
        {
          bookingId: 'bk-cabin-1',
          type: 'other',
          name: 'Aspen Ridge Cabin',
          location: 'Aspen, CO',
          startDatetime: '2026-08-21T16:00:00',
          endDatetime: '2026-08-24T10:00:00',
          confirmation: 'ARC-2291',
          cost: 620,
          addedBy: DEMO_USER.userId,
        },
      ],
      plans: [
        {
          version: 1,
          generatedAt: '2026-07-10T09:00:00Z',
          days: [
            {
              date: 'Aug 21, Fri',
              events: [
                { time: '4:00p', title: 'Check in — Aspen Ridge Cabin', icon: 'hotel' },
                { time: '7:00p', title: 'Fireside dinner, in', icon: 'food' },
              ],
            },
            {
              date: 'Aug 22, Sat',
              events: [{ time: '8:30a', title: 'Hike — Maroon Bells', icon: 'activity' }],
            },
          ],
        },
      ],
    },
  }
}

let store = makeInitialStore()

function findMember(t, userId) {
  return t.members.find((m) => m.userId === userId)
}

function getOr404(tripId) {
  const t = store[tripId]
  if (!t) throw notFound()
  return t
}

function tripSummary(t) {
  const { tripId, name, destination, startDate, endDate, status } = t.trip
  return { tripId, name, destination, startDate, endDate, status }
}

function buildNextPlan(t) {
  const last = t.plans[t.plans.length - 1]
  if (!last) {
    return {
      days: [{ date: t.trip.startDate, events: [{ time: '9:00a', title: `Arrive in ${t.trip.destination}`, icon: 'plane' }] }],
    }
  }
  const departures = t.logistics
    .map((l) => l.departure)
    .filter(Boolean)
    .sort((a, b) => (a.datetime || '').localeCompare(b.datetime || ''))
  const lastDeparture = departures[departures.length - 1]
  const windDownDay = {
    date: t.trip.endDate,
    events: [
      { time: '9:00a', title: 'Free morning — pack up and last-minute shopping', icon: 'other' },
      lastDeparture
        ? { time: 'later', title: `Departures begin (last flight ${lastDeparture.flight || ''})`, icon: 'plane' }
        : { time: 'later', title: 'Head to the airport', icon: 'plane' },
    ],
  }
  return { days: [...last.days, windDownDay] }
}

// Router mirroring the real API's routes — matched by (method, path segments).
export async function demoRequest(method, path, body) {
  const segments = path.split('/').filter(Boolean)

  if (segments[0] !== 'trips') throw notFound()

  // /trips
  if (segments.length === 1) {
    if (method === 'GET') return { trips: Object.values(store).map(tripSummary) }
    if (method === 'POST') {
      const tripId = `demo-${Math.random().toString(36).slice(2, 8)}`
      const trip = {
        tripId,
        name: body?.name || 'Untitled trip',
        destination: body?.destination || '',
        startDate: body?.startDate || '',
        endDate: body?.endDate || '',
        status: 'planning',
        ownerId: DEMO_USER.userId,
      }
      store[tripId] = {
        trip,
        members: [{ userId: DEMO_USER.userId, role: 'owner', preferences: null, companions: [] }],
        logistics: [],
        bookings: [],
        plans: [],
      }
      return { trip }
    }
  }

  // /trips/:tripId
  if (segments.length === 2) {
    const t = getOr404(segments[1])
    if (method === 'GET') {
      return { trip: t.trip, members: t.members, logistics: t.logistics, bookings: t.bookings, plans: t.plans }
    }
  }

  // /trips/:tripId/join, /trips/:tripId/bookings
  if (segments.length === 3) {
    const t = getOr404(segments[1])
    if (segments[2] === 'join' && method === 'POST') {
      if (!findMember(t, DEMO_USER.userId)) {
        t.members.push({ userId: DEMO_USER.userId, role: 'member', preferences: null, companions: [] })
      }
      return { ok: true }
    }
    if (segments[2] === 'bookings' && method === 'POST') {
      const booking = {
        bookingId: `bk-${Math.random().toString(36).slice(2, 8)}`,
        addedBy: DEMO_USER.userId,
        type: body?.type || 'other',
        name: body?.name || '',
        location: body?.location,
        startDatetime: body?.startDatetime,
        endDatetime: body?.endDatetime,
        confirmation: body?.confirmation,
        cost: body?.cost,
      }
      t.bookings.push(booking)
      return { booking }
    }
  }

  // /trips/:tripId/members/me, /trips/:tripId/logistics/me,
  // /trips/:tripId/bookings/:bookingId, /trips/:tripId/plan/generate
  if (segments.length === 4) {
    const t = getOr404(segments[1])

    if (segments[2] === 'members' && segments[3] === 'me' && method === 'PATCH') {
      let m = findMember(t, DEMO_USER.userId)
      if (!m) {
        m = { userId: DEMO_USER.userId, role: 'member', preferences: null, companions: [] }
        t.members.push(m)
      }
      m.preferences = { ...(m.preferences || {}), ...(body?.preferences || {}) }
      m.companions = body?.companions ?? m.companions
      return { member: m }
    }

    if (segments[2] === 'logistics' && segments[3] === 'me' && method === 'PUT') {
      const entry = { userId: DEMO_USER.userId, arrival: body?.arrival || null, departure: body?.departure || null }
      const idx = t.logistics.findIndex((l) => l.userId === DEMO_USER.userId)
      if (idx >= 0) t.logistics[idx] = entry
      else t.logistics.push(entry)
      return { logistics: entry }
    }

    if (segments[2] === 'bookings' && method === 'DELETE') {
      t.bookings = t.bookings.filter((b) => b.bookingId !== segments[3])
      return { ok: true }
    }

    if (segments[2] === 'plan' && segments[3] === 'generate' && method === 'POST') {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const nextVersion = t.plans.length ? Math.max(...t.plans.map((p) => p.version)) + 1 : 1
      const plan = { version: nextVersion, generatedAt: nowIso(), ...buildNextPlan(t) }
      t.plans.push(plan)
      return { plan }
    }
  }

  throw badRequest(`No demo handler for ${method} ${path}`)
}

// Exposed for a possible future "reset demo data" action — not wired to any UI yet.
export function resetDemoStore() {
  store = makeInitialStore()
}
