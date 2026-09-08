import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell'
import './legal.scss'

// Replace with your real contact address (and, once you have one, a
// registered-business address) before this goes in front of real users —
// see LEGAL_CONTACT_EMAIL below and CAN-SPAM's mailing-address requirement,
// already handled for outgoing email itself via SES_MAILING_ADDRESS.
const LEGAL_CONTACT_EMAIL = 'privacy@manifest.app'

// Content reflects what this codebase actually does as of the date below —
// keep this in sync with functions/*, shared/ses.js, and shared/bedrock.js
// (trip-planner-api) whenever a new category of data or a new subprocessor
// is added. This is a solid starting point, not a substitute for review by
// a lawyer licensed where you operate, before opening the app to the public.
export default function Privacy() {
  return (
    <AppShell minimal>
      <div className="legal-page">
        <div className="page-head">
          <h1>Privacy Policy</h1>
        </div>
        <p className="legal-updated">Last updated: September 2026</p>

        <nav className="legal-nav">
          <Link to="/privacy" className="active">
            Privacy Policy
          </Link>
          <Link to="/terms">Terms of Service</Link>
        </nav>

        <div className="legal-body">
          <p>
            Manifest ("Manifest", "we", "us") is a collaborative trip-planning app. This policy
            explains what information we collect when you use it, why, who else sees it, and the
            choices you have. It applies to the Manifest web app and its backend API.
          </p>

          <h2>1. Information we collect</h2>
          <p>You (or someone in your trip) give us:</p>
          <ul>
            <li><strong>Account info</strong> — name, email address, and password, handled by AWS Cognito.</li>
            <li><strong>Trip details</strong> — trip name, destination, dates, and trip type.</li>
            <li>
              <strong>Preferences</strong> — food, activities, budget pace, group dynamics,
              dislikes, and must-dos you enter to help the AI draft an itinerary.
            </li>
            <li>
              <strong>Companion info</strong> — the first name and age of people traveling with
              you who don't have their own Manifest account (kids, partners, parents). This is
              entered by you, about people you're planning for, purely to help the AI pace the
              itinerary appropriately — it does not create an account or profile for them.
            </li>
            <li><strong>Logistics</strong> — your arrival/departure times and transport mode.</li>
            <li><strong>Bookings and expenses</strong> — hotel/car/other bookings you log, and expenses you record for cost-splitting.</li>
            <li><strong>Post-trip feedback</strong> — your mood rating and comment after a trip.</li>
            <li><strong>A theme preference</strong> (light/dark), stored locally and, for a real account, synced to your profile.</li>
          </ul>
          <p>
            We also generate a small amount of data ourselves: which events you mark done,
            skipped, or swapped; suggestions and approvals on a plan; and structured usage logs
            (e.g. "trip created," "plan generated") used only to monitor the service, never sold
            or shared for advertising.
          </p>

          <h2>2. How we use it</h2>
          <ul>
            <li>To generate and refine your group's AI-drafted itinerary and advisor tips.</li>
            <li>To run the collaborative features — suggestions, approvals, notifications, the day-of view.</li>
            <li>To calculate expense splits and settle-up balances.</li>
            <li>To send the email notifications you've opted into (see Section 5).</li>
            <li>To keep the service reliable and secure, and to diagnose problems.</li>
          </ul>
          <p>We do not use your data to train AI models, and we do not sell it to anyone.</p>

          <h2>3. AI processing</h2>
          <p>
            Itinerary generation and advisor tips are produced by Claude models via AWS Bedrock.
            Your trip's preferences, companions, logistics, and existing plan are sent to Bedrock
            as inputs to generate that content; Bedrock processes this as a data processor on our
            behalf and does not use it to train its models. The itinerary is additionally grounded
            with real-world data pulled from OpenStreetMap (opening hours, parking) and OSRM
            (driving routes) — public services queried by destination/coordinates, not by your
            personal information — and current conditions from OpenWeatherMap.
          </p>

          <h2>4. Who else processes your data</h2>
          <p>We use a small number of infrastructure providers to run Manifest. None of them can use your data for their own purposes.</p>
          <table>
            <thead>
              <tr><th>Provider</th><th>Purpose</th></tr>
            </thead>
            <tbody>
              <tr><td>AWS Cognito</td><td>Account creation, login, password reset</td></tr>
              <tr><td>AWS DynamoDB</td><td>Storing trip, account, and app data</td></tr>
              <tr><td>AWS Bedrock (Claude)</td><td>Generating itineraries and advisor tips</td></tr>
              <tr><td>AWS SES</td><td>Sending opt-in email notifications (see Section 5)</td></tr>
              <tr><td>AWS Secrets Manager</td><td>Storing API keys used by the backend</td></tr>
              <tr><td>OpenStreetMap (Overpass) &amp; OSRM</td><td>Opening hours, parking, and driving-route data</td></tr>
              <tr><td>OpenWeatherMap</td><td>Current weather for your destination</td></tr>
              <tr><td>Firebase Hosting</td><td>Serving this web app</td></tr>
            </tbody>
          </table>

          <h2>5. Email</h2>
          <p>
            Trip-starting-soon reminders and activity notifications (someone joined your trip,
            suggested a change, etc.) are <strong>opt-in and off by default</strong> — you turn
            them on in Settings. Every email includes a one-click unsubscribe link and a physical
            mailing address, as required by the CAN-SPAM Act. We never use your email address for
            marketing outside the preferences you've explicitly enabled.
          </p>

          <h2>6. Cookies and local storage</h2>
          <p>
            Manifest doesn't use third-party advertising or tracking cookies. Your browser's local
            storage holds your signed-in session (via AWS Amplify) and your theme preference —
            both used only to run the app for you.
          </p>

          <h2>7. Data retention</h2>
          <p>
            Your data is kept for as long as your account or trip exists. Deleting a trip removes
            that trip's entire aggregate (members, bookings, expenses, plan, etc.). Leaving a trip
            removes your own membership from it. See Section 8 for closing your account entirely.
          </p>

          <h2>8. Your rights</h2>
          <p>
            You can access or correct most of your information directly in the app (Settings,
            trip editing, bookings, expenses). Full self-service account deletion isn't built yet
            — until it is, email us at{' '}
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> to request a copy
            or deletion of your data, and we'll handle it manually. If you're in a jurisdiction
            with statutory rights (e.g. GDPR, CCPA), those rights apply and we'll respond
            accordingly.
          </p>

          <h2>9. Children's privacy</h2>
          <p>
            Manifest accounts are for adults planning trips. The "companions" feature lets an
            adult account holder record a minor's first name and age for that adult's own
            trip-planning purposes only — it does not create an account, login, or independent
            profile for a minor, and that information is only ever visible to the trip's own
            members.
          </p>

          <h2>10. Security</h2>
          <p>
            Traffic to and from Manifest is encrypted in transit (HTTPS/TLS). Credentials are
            handled by AWS Cognito, never stored by us in plain text. Backend access to your data
            is scoped by IAM to only what each function needs, and our database has point-in-time
            recovery and deletion protection enabled to guard against accidental data loss.
          </p>

          <h2>11. Changes to this policy</h2>
          <p>
            If we make a material change to this policy, we'll update the "Last updated" date
            above and, where appropriate, let you know in the app.
          </p>

          <h2>12. Contact</h2>
          <p>
            Questions about this policy or your data? Email{' '}
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
