import { Link } from 'react-router-dom'
import { Icon } from './Icon'

const TABS = [
  { key: 'itinerary', label: 'Itinerary', icon: 'route', path: (tripId) => `/trip/${tripId}/itinerary` },
  { key: 'today', label: 'Today', icon: 'sun', path: (tripId) => `/trip/${tripId}/today` },
  { key: 'expenses', label: 'Expenses', icon: 'wallet', path: (tripId) => `/trip/${tripId}/expenses` },
]

// Navigation between a trip's three views. Kept out of each page's action
// bar on purpose — those hold real actions (Invite, Add booking, Regenerate,
// Delete), not "go look at something else" links.
export default function TripTabs({ tripId, active, showToday }) {
  return (
    <div className="trip-tabs">
      {TABS.filter((t) => t.key !== 'today' || showToday).map((t) => (
        <Link key={t.key} className={`trip-tab${active === t.key ? ' active' : ''}`} to={t.path(tripId)}>
          <Icon name={t.icon} />
          {t.label}
        </Link>
      ))}
    </div>
  )
}
