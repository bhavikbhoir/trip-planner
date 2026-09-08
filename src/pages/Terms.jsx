import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import './legal.scss'

// See the matching note in Privacy.jsx — replace with a real contact
// address, and have a lawyer licensed where you operate review both pages,
// before this goes in front of the public.
const LEGAL_CONTACT_EMAIL = 'bhvkbhoir@gmail.com'

export default function Terms() {
  return (
    <AppShell minimal>
      <div className="legal-page">
        <div className="page-head">
          <h1>Terms of Service</h1>
        </div>
        <p className="legal-updated">Last updated: September 2026</p>

        <nav className="legal-nav">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms" className="active">
            Terms of Service
          </Link>
        </nav>

        <div className="legal-body">
          <p>
            These terms govern your use of Manifest, a collaborative AI trip-planning app. By
            creating an account or using Manifest, you agree to them. If you don't agree, please
            don't use the service.
          </p>

          <h2>1. Eligibility and accounts</h2>
          <p>
            You must be able to form a binding contract in your jurisdiction (generally 18, or
            the age of majority where you live) to create an account. You're responsible for the
            accuracy of the information on your account and for keeping your password secure. The
            "companions" feature lets you record a minor's name and age for your own trip
            planning — it does not create an account for them, and minors may not hold a Manifest
            account themselves.
          </p>

          <h2>2. What Manifest does</h2>
          <p>
            Manifest helps a group plan a trip together: collecting preferences, generating an
            AI-drafted itinerary, tracking suggestions and approvals, logging bookings and
            expenses, and recording what actually happened during the trip. A demo mode lets you
            try the app without an account, using sample data that is never stored or sent
            anywhere.
          </p>

          <h2>3. AI-generated content is a starting point, not a guarantee</h2>
          <p>
            Itineraries, advisor tips, opening hours, parking notes, travel-time estimates, and
            weather shown in the app are generated or sourced from AI models and third-party data
            (OpenStreetMap, OSRM, OpenWeatherMap) that can be incomplete, outdated, or wrong.
            <strong> Always verify opening hours, reservations, prices, travel times, and safety
            information independently before relying on them</strong> — especially before making
            a non-refundable booking or a time-sensitive connection.
          </p>

          <h2>4. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use Manifest for anything illegal, or to harass, impersonate, or harm anyone.</li>
            <li>Enter another real person's personal information (including as a "companion") without their knowledge, where doing so would violate their privacy.</li>
            <li>Attempt to bypass rate limits, scrape the API, or otherwise interfere with the service's normal operation.</li>
            <li>Reverse-engineer, resell, or use the service to build a competing product.</li>
          </ul>
          <p>We may suspend or terminate accounts that violate these terms.</p>

          <h2>5. Your content</h2>
          <p>
            You own the trip content you create (preferences, bookings, expenses, feedback, etc.).
            By using Manifest, you grant us a license to store, process, and display that content
            solely to provide the service to you and the other members of your trip — nothing
            more.
          </p>

          <h2>6. Third-party services</h2>
          <p>
            Manifest relies on third-party infrastructure and data sources, described in our{' '}
            <Link to="/privacy">Privacy Policy</Link>. We aren't responsible for outages,
            inaccuracies, or changes in those services that are outside our control.
          </p>

          <h2>7. Service provided "as is"</h2>
          <p>
            Manifest is provided on an "as is" and "as available" basis, without warranties of
            any kind, express or implied, including fitness for a particular purpose or
            uninterrupted availability. This is a small, cost-conscious service — we do our best
            to keep it reliable (see our reliability guardrails), but we don't guarantee it.
          </p>

          <h2>8. Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, Manifest and its operators aren't liable for
            any indirect, incidental, or consequential damages arising from your use of the
            service — including a missed reservation, an inaccurate itinerary detail, or a lost
            booking record — beyond what applicable law requires.
          </p>

          <h2>9. Termination</h2>
          <p>
            You can stop using Manifest at any time — leave a trip, delete a trip you own, or
            email us to close your account entirely (see our <Link to="/privacy">Privacy Policy</Link>{' '}
            for how). We may suspend or terminate access for violating these terms.
          </p>

          <h2>10. Changes to these terms</h2>
          <p>
            We may update these terms as the service changes. We'll update the "Last updated"
            date above when we do, and material changes will be flagged in the app.
          </p>

          <h2>11. Governing law</h2>
          <p>
            [Insert your governing jurisdiction here before launch.] These terms are governed by
            the laws of that jurisdiction, without regard to conflict-of-law principles.
          </p>

          <h2>12. Contact</h2>
          <p>
            Questions about these terms? Email{' '}
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
