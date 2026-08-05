# MANIFEST — Trip Planner (frontend)

React + Vite frontend for a collaborative AI group trip planner. Companion backend lives in `../trip-planner-api`.

## Stack

React 18 + Vite 6, Framer Motion, SCSS (token-based theming, light = paper boarding pass / dark = split-flap board), `react-router-dom`, AWS Amplify for Cognito auth, Leaflet for maps, deployed to Firebase Hosting.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # http://localhost:5173
```

### Env vars (`.env.local`)

```
VITE_COGNITO_USER_POOL_ID=   # from trip-planner-api's deployed Cognito User Pool
VITE_COGNITO_CLIENT_ID=      # from trip-planner-api's deployed Cognito User Pool Client
VITE_API_BASE=               # trip-planner-api's HTTP API base URL
```

No env vars are required just to click around — click "Try the demo" on the
login screen for a fully seeded, backend-free walkthrough (see Demo mode
below).

## What's here

- **Auth**: `Login`, `Register` (with email confirmation step) wired to Cognito via `src/contexts/AuthContext.jsx`; a settle-up-safe `next` redirect (`src/utils/safeNext.js`) so post-login redirects can't be hijacked by a crafted link.
- **Trips**: `TripDashboard` (list), `CreateTrip`, `JoinTrip` (shareable invite link), `Preferences` (food/activities/budget/group dynamics/companions questionnaire).
- **Itinerary** (`Itinerary.jsx`): AI-generated day-by-day plan with real grounded data (opening hours, parking, driving/walking travel times between stops), manual bookings shown as timeline anchors, suggestions + per-member approval tracking, an AI advisor tips panel (hotel-area fit, arrival gaps, tight departures, coverage gaps — dismissible, one-click "turn into a suggestion").
- **Day-of view** (`DayOf.jsx`): today's events only, with a simple mark-done toggle per event for tracking progress while the trip is actually happening.
- **Expenses** (`Expenses.jsx` + `src/utils/expenses.js`): log shared costs, automatic balance calculation and greedy debt-simplified "who owes who" settle-up.
- **Settings** (`Settings.jsx`): update display name (syncs Cognito + every trip the user belongs to).
- **Navigation**: `TripTabs.jsx` — Itinerary / Today / Expenses tab strip on every trip page; `AppShell.jsx` — global shell with a polling notification bell (member joined, suggestion added, plan regenerated) and a Settings link.
- **Theme**: follows the OS/browser dark-light preference by default; the sun/moon toggle in the topbar (`src/utils/theme.js`) pins an explicit override to `localStorage` (applied before first paint via an inline script in `index.html`, so there's no flash of the wrong palette on reload) and, for a real account, syncs it to the backend (`GET/PATCH /me`) so the choice follows you to another device — demo mode stays local-only since there's no real account to sync to. Shown on every page, including logged-out ones.
- **Maps**: `DayMap.jsx` (Leaflet + OpenStreetMap tiles, no Google Maps billing), `PlaceAutocomplete.jsx`.
- `src/utils/api.js` — bearer-token fetch wrapper, decoupled from React via `setTokenProvider`.
- `src/components/motion.jsx` — `Reveal` / `StaggerContainer` / `StaggerItem` Framer Motion primitives.

## Tests

```bash
npm run test   # vitest, run once (no watch)
```

Unit tests for the pure logic modules: expense balance/debt-simplification
math (`src/utils/expenses.js`) and the open-redirect guard (`src/utils/safeNext.js`).
Runs in CI on every push, before lint and build.

## Demo mode

`src/utils/demoData.js` + `enterDemo()` (`AuthContext.jsx`) run the entire
app against seeded in-memory data — no Cognito, no backend, no AWS account
needed. Every route (`/today`, `/expenses`, advisor tips, mark-done, etc.)
has a matching demo handler in `demoRequest()`. This is the fastest way to
see the whole app and is what's linked from the login screen for
recruiters/visitors who don't want to create an account.

## Deploy

Manual (first time, or to set up the real Firebase project):

```bash
firebase login
# set the real Firebase project id in .firebaserc first
npm run deploy   # build + firebase deploy
```

### CI/CD

`.github/workflows/deploy.yml` — push to `master` lints, tests, builds, and
deploys straight to the Firebase Hosting `live` channel (no separate
dev/prod split on the frontend side — only merges trigger a deploy, not pull
requests).

Required GitHub Actions secrets:

| Secret                        | Description                                              |
|--------------------------------|------------------------------------------------------------|
| `VITE_COGNITO_USER_POOL_ID`    | from `trip-planner-api`'s deployed Cognito User Pool      |
| `VITE_COGNITO_CLIENT_ID`       | from `trip-planner-api`'s deployed Cognito User Pool Client|
| `VITE_API_BASE`                | `trip-planner-api`'s HTTP API base URL — point this at whichever backend stage (dev/prod) the live site should talk to |
| `FIREBASE_SERVICE_ACCOUNT`     | JSON key for a Firebase service account with Hosting deploy permission |

`.firebaserc` must have the real Firebase project id committed (not the
`REPLACE-ME` placeholder) before this workflow can deploy anywhere.

## Status

Full collaborative loop is live end-to-end: create a trip, invite a group,
everyone submits preferences, AI generates a real-data-grounded itinerary,
the group suggests changes and approves, day-of tracking and expense
settle-up carry the trip through to the end. A starter unit test suite
covers the pure logic; component-level testing is the next real gap.
