import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Leaflet's default marker icon references image files by URL that Vite's
// bundler doesn't resolve automatically — rebuild it from the package's own
// assets so pins actually render instead of showing broken images.
const markerIcon = new L.Icon({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Renders a small OpenStreetMap view for one day's located events. Returns
// null (renders nothing) if fewer than one event has coordinates — most
// events won't, since coordinates are best-effort model estimates, not
// authoritative geocoding.
export default function DayMap({ events }) {
  const located = events.filter((e) => typeof e.lat === 'number' && typeof e.lng === 'number')
  if (located.length === 0) return null

  const positions = located.map((e) => [e.lat, e.lng])
  const center = positions[Math.floor(positions.length / 2)]

  return (
    <div className="day-map glass">
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: 220, width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {positions.length > 1 && <Polyline positions={positions} pathOptions={{ color: '#157A9E', weight: 3, opacity: 0.7 }} />}
        {located.map((e, i) => (
          <Marker key={i} position={[e.lat, e.lng]} icon={markerIcon} />
        ))}
      </MapContainer>
    </div>
  )
}
