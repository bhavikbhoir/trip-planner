// Trip phase is derived, not stored — only the explicit completedAt override
// is persisted (see trip-planner-api CLAUDE.md's data model). This mirrors
// the backend's own reasoning client-side so the UI can badge/gate on phase
// without a round-trip: completedAt always wins (a trip can be closed early,
// or stay open past its dates if nobody's marked it done yet).
export function tripPhase(trip) {
  if (!trip) return null
  if (trip.completedAt) return 'completed'
  const today = new Date().toISOString().slice(0, 10)
  if (trip.endDate && today > trip.endDate) return 'completed'
  if (trip.startDate && today >= trip.startDate) return 'in_progress'
  return 'upcoming'
}
