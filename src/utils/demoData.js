// Local, in-memory demo mode — lets the UI be clicked through end-to-end
// with zero backend deployed. Mirrors the exact response shapes trip-planner-api
// returns, so pages need no special-casing (see api.js's `request()` early return).

export const DEMO_STORAGE_KEY = 'tp_demo'
export const DEMO_USER = { userId: 'demo-user', username: 'you@manifest.app', displayName: 'Bhavik' }

const DISPLAY_NAMES = { 'demo-user': 'Bhavik', sam: 'Sam', priya: 'Priya', jordan: 'Jordan' }
const HTTP_URL_RE = /^https?:\/\//i

// Mock GET .../weather responses, keyed by tripId — mirrors the real
// endpoint's shape ({weather: {temperature, condition, city, icon}}), a
// current-conditions snapshot, not a forecast.
const DEMO_WEATHER = {
  'demo-bali': { temperature: 87, condition: 'scattered thunderstorms', city: 'Ubud', icon: '11d' },
  'demo-cabin': { temperature: 61, condition: 'clear sky', city: 'Aspen', icon: '01d' },
}

// Mock POST .../advisor/generate responses — there's no Bedrock to call in
// demo mode, so these are hand-authored against demo-bali's actual seed data
// (real names/times) rather than generic placeholder text, to look like a
// genuine Haiku pass rather than a canned demo.
const DEMO_TIPS = {
  'demo-bali': [
    { category: 'arrival_gap', text: "Jordan lands Nov 13 at 6:05p, almost a full day before Priya arrives Nov 14 at 1:15p — worth planning something low-key for Jordan's first evening solo." },
    { category: 'departure_timing', text: 'Jordan departs Nov 20 at 8:30p, a day ahead of everyone else — make sure their last full day wraps early enough to pack and get to the airport.' },
    { category: 'coverage_gap', text: "Priya listed a kid-friendly beach afternoon as a must-do, but the current plan doesn't have a dedicated beach day yet." },
  ],
}

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

function forbidden(msg) {
  const e = new Error(msg)
  e.status = 403
  return e
}

function nowIso() {
  return new Date().toISOString()
}

// Mirrors trip-planner-api's functions/trips/today.js — event times are
// "H:MMa/p" strings, so a plain string sort would put "10:00a" before "9:40a".
function timeToMinutes(time) {
  const match = /^(\d{1,2}):(\d{2})\s*([ap])/i.exec((time || '').trim())
  if (!match) return Number.MAX_SAFE_INTEGER
  let hour = parseInt(match[1], 10) % 12
  if (match[3].toLowerCase() === 'p') hour += 12
  return hour * 60 + parseInt(match[2], 10)
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
        tripType: 'friends',
      },
      members: [
        {
          userId: DEMO_USER.userId,
          displayName: DISPLAY_NAMES[DEMO_USER.userId],
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
          displayName: DISPLAY_NAMES.sam,
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
          displayName: DISPLAY_NAMES.priya,
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
          displayName: DISPLAY_NAMES.jordan,
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
          transportMode: 'driving',
          seatsAvailable: 2,
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
          transportMode: 'need_ride',
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
          referenceLink: 'https://www.booking.com/hotel/id/ubud-jungle-villas.html',
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
                { eventId: 'ev-bali-1', time: '9:40a', title: 'Sam arrives', icon: 'plane' },
                { eventId: 'ev-bali-2', time: '1:15p', title: 'Priya arrives', icon: 'plane' },
                { eventId: 'ev-bali-3', time: '3:00p', title: 'Check in — Ubud Jungle Villas', icon: 'hotel', lat: -8.5069, lng: 115.2625 },
                {
                  eventId: 'ev-bali-4',
                  time: '6:00p',
                  title: 'Dinner — Warung Sopa',
                  icon: 'food',
                  lat: -8.5195,
                  lng: 115.2617,
                  costPerPerson: 12,
                  timeToSpend: '1–1.5 hrs',
                  // Real numbers from a live OSRM lookup on these exact coordinates.
                  travelFromPrevious: { walkMinutes: 18, straightLineMeters: 1404, drive: { distanceMeters: 1823, durationMinutes: 3 } },
                  openingHours: '11:00-21:00 — OpenStreetMap listing for "Warung Sopa" nearby, verify it\'s the right venue',
                },
              ],
            },
            {
              date: 'Nov 15, Sun',
              events: [
                { eventId: 'ev-bali-5', time: '5:30a', title: 'Depart for Mt. Batur sunrise trek', icon: 'car' },
                {
                  eventId: 'ev-bali-6',
                  time: '9:00a',
                  title: 'Sunrise trek, Mt. Batur',
                  icon: 'activity',
                  note: 'Maya (7) and Leo (10) are on this leg — swapped the summit push for the Kintamani viewpoint (30 min, same sunrise view).',
                  lat: -8.2422,
                  lng: 115.3752,
                  costPerPerson: 35,
                  timeToSpend: '~1.5 hrs',
                  nearbyParking: 'Kintamani Viewpoint Parking',
                },
              ],
            },
          ],
        },
      ],
      suggestions: [
        {
          suggestionId: 'sug-1',
          authorId: 'priya',
          text: "Swap Day 2 lunch to somewhere vegetarian — the current pick has almost nothing for me.",
          targetPlanVersion: 1,
          status: 'open',
          createdAt: '2026-07-21T09:00:00Z',
        },
        {
          suggestionId: 'sug-2',
          authorId: 'jordan',
          text: 'Can we add a beach afternoon? Feels packed with hikes so far.',
          targetPlanVersion: 1,
          status: 'open',
          createdAt: '2026-07-21T10:30:00Z',
        },
      ],
      approvals: [
        { userId: DEMO_USER.userId, planVersion: 1, approvedAt: '2026-07-20T11:00:00Z' },
        { userId: 'sam', planVersion: 1, approvedAt: '2026-07-20T15:00:00Z' },
      ],
      // Seeded so the day-of view has a realistic "trip in progress" look —
      // Sam's arrival already checked off, the rest of today still pending.
      doneEventIds: ['ev-bali-1'],
      expenses: [
        {
          expenseId: 'exp-1',
          description: 'Dinner — Warung Sopa',
          amount: 48,
          paidBy: DEMO_USER.userId,
          splitBetween: [DEMO_USER.userId, 'sam', 'priya', 'jordan'],
          addedBy: DEMO_USER.userId,
          createdAt: '2026-07-25T20:00:00Z',
        },
        {
          expenseId: 'exp-2',
          description: 'Airport taxi',
          amount: 20,
          paidBy: 'sam',
          splitBetween: [DEMO_USER.userId, 'sam'],
          addedBy: 'sam',
          createdAt: '2026-07-25T10:00:00Z',
        },
      ],
      tips: [],
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
        { userId: DEMO_USER.userId, displayName: DISPLAY_NAMES[DEMO_USER.userId], role: 'owner', preferences: { food: ['Cafes & coffee'], activities: ['Hiking & nature'], budgetPace: ['Mid-range'], groupDynamics: [], dislikes: '', mustDo: '' }, companions: [] },
        { userId: 'sam', displayName: DISPLAY_NAMES.sam, role: 'member', preferences: { food: [], activities: ['Nightlife'], budgetPace: [], groupDynamics: [], dislikes: '', mustDo: '' }, companions: [] },
        { userId: 'priya', displayName: DISPLAY_NAMES.priya, role: 'member', preferences: { food: [], activities: [], budgetPace: [], groupDynamics: [], dislikes: '', mustDo: '' }, companions: [] },
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
                { eventId: 'ev-cabin-1', time: '4:00p', title: 'Check in — Aspen Ridge Cabin', icon: 'hotel' },
                { eventId: 'ev-cabin-2', time: '7:00p', title: 'Fireside dinner, in', icon: 'food' },
              ],
            },
            {
              date: 'Aug 22, Sat',
              events: [{ eventId: 'ev-cabin-3', time: '8:30a', title: 'Hike — Maroon Bells', icon: 'activity' }],
            },
          ],
        },
      ],
      suggestions: [],
      approvals: [
        { userId: DEMO_USER.userId, planVersion: 1, approvedAt: '2026-07-09T09:00:00Z' },
        { userId: 'sam', planVersion: 1, approvedAt: '2026-07-09T12:00:00Z' },
        { userId: 'priya', planVersion: 1, approvedAt: '2026-07-09T18:00:00Z' },
      ],
      doneEventIds: [],
      expenses: [],
      tips: [],
    },
  }
}

let store = makeInitialStore()

// Seeded so the notification bell has something to show in demo mode — real
// notifications are fanned out server-side (on join, new suggestion, and
// plan regeneration), which demo mode has no independent-actor model to
// simulate, so these are static rather than dynamically generated.
let notifications = [
  {
    notificationId: 'notif-1',
    tripId: 'demo-bali',
    tripName: 'Bali w/ Crew',
    type: 'member_joined',
    actorDisplayName: 'Jordan',
    createdAt: '2026-07-25T14:00:00Z',
    read: false,
  },
  {
    notificationId: 'notif-2',
    tripId: 'demo-bali',
    tripName: 'Bali w/ Crew',
    type: 'suggestion_added',
    actorDisplayName: 'Priya',
    createdAt: '2026-07-21T09:00:00Z',
    read: false,
  },
  {
    notificationId: 'notif-3',
    tripId: 'demo-bali',
    tripName: 'Bali w/ Crew',
    type: 'plan_generated',
    actorDisplayName: 'Bhavik',
    createdAt: '2026-07-20T10:00:00Z',
    read: true,
  },
  {
    notificationId: 'notif-4',
    tripId: 'demo-bali',
    tripName: 'Bali w/ Crew',
    type: 'member_joined',
    actorDisplayName: 'Priya',
    createdAt: '2026-07-20T09:30:00Z',
    read: true,
  },
]

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

function newEventId() {
  return `ev-${Math.random().toString(36).slice(2, 8)}`
}

function buildNextPlan(t) {
  const last = t.plans[t.plans.length - 1]
  if (!last) {
    return {
      days: [{ date: t.trip.startDate, events: [{ eventId: newEventId(), time: '9:00a', title: `Arrive in ${t.trip.destination}`, icon: 'plane' }] }],
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
      { eventId: newEventId(), time: '9:00a', title: 'Free morning — pack up and last-minute shopping', icon: 'other' },
      lastDeparture
        ? { eventId: newEventId(), time: 'later', title: `Departures begin (last flight ${lastDeparture.flight || ''})`, icon: 'plane' }
        : { eventId: newEventId(), time: 'later', title: 'Head to the airport', icon: 'plane' },
    ],
  }
  return { days: [...last.days, windDownDay] }
}

// Router mirroring the real API's routes — matched by (method, path segments).
// Split the query string off before segmenting — nothing used one until the
// "today" endpoint's ?date= param, and left in place it would corrupt the
// last path segment (e.g. "today?date=...") for every route below.
export async function demoRequest(method, path, body) {
  const [cleanPath, queryString] = path.split('?')
  const query = new URLSearchParams(queryString || '')
  const segments = cleanPath.split('/').filter(Boolean)

  if (segments[0] === 'notifications') {
    if (segments.length === 1 && method === 'GET') {
      const sorted = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50)
      return { notifications: sorted, unreadCount: notifications.filter((n) => !n.read).length }
    }
    if (segments.length === 2 && segments[1] === 'mark-read' && method === 'POST') {
      notifications = notifications.map((n) => ({ ...n, read: true }))
      return { ok: true }
    }
    throw badRequest(`No demo handler for ${method} ${path}`)
  }

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
        tripType: body?.tripType || null,
      }
      store[tripId] = {
        trip,
        members: [
          { userId: DEMO_USER.userId, displayName: DEMO_USER.displayName, role: 'owner', preferences: null, companions: [] },
        ],
        logistics: [],
        bookings: [],
        plans: [],
        suggestions: [],
        approvals: [],
        doneEventIds: [],
        expenses: [],
        tips: [],
      }
      return { trip }
    }
  }

  // /trips/:tripId
  if (segments.length === 2) {
    const t = getOr404(segments[1])
    if (method === 'GET') {
      return {
        trip: t.trip,
        members: t.members,
        logistics: t.logistics,
        bookings: t.bookings,
        plans: t.plans,
        suggestions: t.suggestions || [],
        approvals: t.approvals || [],
        eventCompletions: (t.doneEventIds || []).map((eventId) => ({ eventId })),
        expenses: t.expenses || [],
        tips: t.tips || [],
      }
    }
    if (method === 'DELETE') {
      if (t.trip.ownerId !== DEMO_USER.userId) throw forbidden('Only the trip owner can delete this trip.')
      delete store[segments[1]]
      return { deleted: true, tripId: segments[1] }
    }
  }

  // /trips/:tripId/join, /trips/:tripId/bookings, /trips/:tripId/suggestions, /trips/:tripId/finalize, /trips/:tripId/weather, /trips/:tripId/preview
  if (segments.length === 3) {
    const t = getOr404(segments[1])
    if (segments[2] === 'preview' && method === 'GET') {
      return { name: t.trip.name, destination: t.trip.destination, memberCount: t.members.length }
    }
    if (segments[2] === 'today' && method === 'GET') {
      const latest = t.plans.length ? t.plans.reduce((a, b) => (b.version > a.version ? b : a)) : null
      // Demo seed days use display-formatted dates ('Nov 14, Sat'), not the
      // real backend's ISO "YYYY-MM-DD" — an exact match against the real
      // "today" query param would (correctly) almost never hit, since these
      // demo trips aren't scheduled around the actual current date. Fall
      // back to the first day of the latest plan so the page has something
      // to show; an exact day.date match still wins if the caller passes it.
      const day = (latest?.days || []).find((d) => d.date === query.get('date')) || latest?.days?.[0] || null
      const events = (day?.events || [])
        .slice()
        .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
        .map((ev) => ({ ...ev, done: (t.doneEventIds || []).includes(ev.eventId) }))
      return {
        date: day?.date || null,
        tripStatus: t.trip.status,
        planVersion: latest?.version || null,
        events,
        bookings: t.bookings,
      }
    }
    if (segments[2] === 'expenses' && method === 'POST') {
      const memberIds = t.members.map((m) => m.userId)
      const split = Array.isArray(body?.splitBetween) && body.splitBetween.length ? body.splitBetween : memberIds
      const expense = {
        expenseId: `exp-${Math.random().toString(36).slice(2, 8)}`,
        description: body?.description || '',
        amount: Number(body?.amount) || 0,
        paidBy: body?.paidBy || DEMO_USER.userId,
        splitBetween: split,
        addedBy: DEMO_USER.userId,
        createdAt: nowIso(),
      }
      t.expenses = [...(t.expenses || []), expense]
      return { expense }
    }
    if (segments[2] === 'weather' && method === 'GET') {
      const cityGuess = (t.trip.destination || '').split(',')[0].trim() || t.trip.destination
      return {
        weather: DEMO_WEATHER[t.trip.tripId] || { temperature: 84, condition: 'scattered clouds', city: cityGuess, icon: '03d' },
      }
    }
    if (segments[2] === 'join' && method === 'POST') {
      if (!findMember(t, DEMO_USER.userId)) {
        t.members.push({ userId: DEMO_USER.userId, displayName: DEMO_USER.displayName, role: 'member', preferences: null, companions: [] })
      }
      return { ok: true }
    }
    if (segments[2] === 'suggestions' && method === 'POST') {
      const suggestion = {
        suggestionId: `sug-${Math.random().toString(36).slice(2, 8)}`,
        authorId: DEMO_USER.userId,
        text: body?.text || '',
        targetPlanVersion: body?.targetPlanVersion,
        status: 'open',
        createdAt: nowIso(),
      }
      t.suggestions = [...(t.suggestions || []), suggestion]
      return { suggestion }
    }
    if (segments[2] === 'finalize' && method === 'POST') {
      const isOwner = t.trip.ownerId === DEMO_USER.userId
      const latest = t.plans.length ? t.plans.reduce((a, b) => (b.version > a.version ? b : a)) : null
      if (!latest) throw badRequest('Generate an itinerary before finalizing.')
      const approvedIds = new Set((t.approvals || []).filter((a) => a.planVersion === latest.version).map((a) => a.userId))
      const missing = t.members.filter((m) => !approvedIds.has(m.userId))
      if (!isOwner && missing.length > 0) {
        throw badRequest(`${missing.length} of ${t.members.length} members haven't approved yet.`)
      }
      t.trip.status = 'finalized'
      return { trip: t.trip }
    }
    if (segments[2] === 'bookings' && method === 'POST') {
      const link = body?.referenceLink
      if (link && !HTTP_URL_RE.test(link)) {
        throw badRequest('referenceLink must start with http:// or https://')
      }
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
        referenceLink: link || null,
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
        m = { userId: DEMO_USER.userId, displayName: DEMO_USER.displayName, role: 'member', preferences: null, companions: [] }
        t.members.push(m)
      }
      m.preferences = { ...(m.preferences || {}), ...(body?.preferences || {}) }
      m.companions = body?.companions ?? m.companions
      m.displayName = body?.displayName ?? m.displayName ?? DEMO_USER.displayName
      return { member: m }
    }

    if (segments[2] === 'members' && segments[3] === 'me' && method === 'DELETE') {
      if (t.trip.ownerId === DEMO_USER.userId) throw forbidden('Trip owners can’t leave — delete the trip instead.')
      t.members = t.members.filter((m) => m.userId !== DEMO_USER.userId)
      t.logistics = t.logistics.filter((l) => l.userId !== DEMO_USER.userId)
      return { ok: true }
    }

    if (segments[2] === 'suggestions' && method === 'DELETE') {
      t.suggestions = (t.suggestions || []).filter((s) => s.suggestionId !== segments[3])
      return { ok: true }
    }

    if (segments[2] === 'approvals' && segments[3] === 'me' && method === 'PUT') {
      const planVersion = body?.planVersion
      const existing = (t.approvals || []).find((a) => a.userId === DEMO_USER.userId && a.planVersion === planVersion)
      if (existing) return { approval: existing }
      const approval = { userId: DEMO_USER.userId, planVersion, approvedAt: nowIso() }
      t.approvals = [...(t.approvals || []), approval]
      return { approval }
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

    if (segments[2] === 'expenses' && method === 'DELETE') {
      t.expenses = (t.expenses || []).filter((e) => e.expenseId !== segments[3])
      return { deleted: true, expenseId: segments[3] }
    }

    if (segments[2] === 'plan' && segments[3] === 'generate' && method === 'POST') {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const nextVersion = t.plans.length ? Math.max(...t.plans.map((p) => p.version)) + 1 : 1
      const plan = { version: nextVersion, generatedAt: nowIso(), ...buildNextPlan(t) }
      t.plans.push(plan)
      return { plan }
    }

    if (segments[2] === 'advisor' && segments[3] === 'generate' && method === 'POST') {
      await new Promise((resolve) => setTimeout(resolve, 700))
      const proposed = DEMO_TIPS[t.trip.tripId] || []
      t.tips = proposed.map((tip, i) => ({ tipId: `tip-${i}-${Math.random().toString(36).slice(2, 6)}`, ...tip }))
      return { tips: t.tips }
    }

    if (segments[2] === 'advisor' && method === 'DELETE') {
      t.tips = (t.tips || []).filter((tip) => tip.tipId !== segments[3])
      return { deleted: true, tipId: segments[3] }
    }
  }

  // /trips/:tripId/events/:eventId/done
  if (segments.length === 5 && segments[2] === 'events' && segments[4] === 'done') {
    const t = getOr404(segments[1])
    const eventId = segments[3]
    t.doneEventIds = t.doneEventIds || []
    if (method === 'PUT') {
      if (!t.doneEventIds.includes(eventId)) t.doneEventIds.push(eventId)
      return { done: true, eventId }
    }
    if (method === 'DELETE') {
      t.doneEventIds = t.doneEventIds.filter((id) => id !== eventId)
      return { done: false, eventId }
    }
  }

  throw badRequest(`No demo handler for ${method} ${path}`)
}

// Exposed for a possible future "reset demo data" action — not wired to any UI yet.
export function resetDemoStore() {
  store = makeInitialStore()
}
