import { Link } from 'react-router-dom'
import { Icon } from './Icon'

const TABS = [
  { key: 'itinerary', label: 'Itinerary', icon: 'route', path: (tripId) => `/trip/${tripId}/itinerary` },
  { key: 'today', label: 'Today', icon: 'sun', path: (tripId) => `/trip/${tripId}/today` },
  { key: 'bookings', label: 'Bookings', icon: 'bed', path: (tripId) => `/trip/${tripId}/bookings` },
  { key: 'expenses', label: 'Expenses', icon: 'wallet', path: (tripId) => `/trip/${tripId}/expenses` },
  { key: 'recap', label: 'Recap', icon: 'sparkle', path: (tripId) => `/trip/${tripId}/recap` },
]

// Navigation between a trip's views. Kept out of each page's action bar on
// purpose — those hold real actions (Invite, Add booking, Regenerate,
// Delete), not "go look at something else" links.
export default function TripTabs({ tripId, active, showToday, showRecap }) {
  return (
    <div className="trip-tabs">
      {TABS.filter((t) => (t.key !== 'today' || showToday) && (t.key !== 'recap' || showRecap)).map((t) => (
        <Link
          key={t.key}
          className={`trip-tab${active === t.key ? ' active' : ''}`}
          to={t.path(tripId)}
          aria-current={active === t.key ? 'page' : undefined}
        >
          <Icon name={t.icon} />
          {t.label}
        </Link>
      ))}
    </div>
  )
}
