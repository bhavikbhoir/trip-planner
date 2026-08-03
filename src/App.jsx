import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { IconSprite } from './components/Icon'
import AmbientBackground from './components/AmbientBackground'
import Login from './pages/Login'
import Register from './pages/Register'
import TripDashboard from './pages/TripDashboard'
import CreateTrip from './pages/CreateTrip'
import JoinTrip from './pages/JoinTrip'
import Preferences from './pages/Preferences'
import Itinerary from './pages/Itinerary'
import DayOf from './pages/DayOf'
import Expenses from './pages/Expenses'
import Settings from './pages/Settings'

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="app-shell">
        <p className="eyebrow">Loading…</p>
      </div>
    )
  }
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }
  return children
}

export default function App() {
  return (
    <>
      <IconSprite />
      <AmbientBackground />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <TripDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/new"
          element={
            <ProtectedRoute>
              <CreateTrip />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trip/:tripId/join"
          element={
            <ProtectedRoute>
              <JoinTrip />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trip/:tripId/preferences"
          element={
            <ProtectedRoute>
              <Preferences />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trip/:tripId/itinerary"
          element={
            <ProtectedRoute>
              <Itinerary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trip/:tripId/today"
          element={
            <ProtectedRoute>
              <DayOf />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trip/:tripId/expenses"
          element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
