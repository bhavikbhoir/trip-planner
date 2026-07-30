# MANIFEST — Trip Planner (frontend)

React + Vite frontend for a collaborative AI group trip planner. Companion backend lives in `../trip-planner-api`.

## Stack

React 18 + Vite 6, Framer Motion, SCSS (token-based theming, light = paper boarding pass / dark = split-flap board), `react-router-dom`, AWS Amplify for Cognito auth, deployed to Firebase Hosting.

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

## What's here (Phase 1 + 2 of the build plan)

- Auth: `Login`, `Register` (with email confirmation step) wired to Cognito via `src/contexts/AuthContext.jsx`
- `src/utils/api.js` — bearer-token fetch wrapper, decoupled from React via `setTokenProvider`
- `TripDashboard` (`GET /trips`), `CreateTrip` (`POST /trips`), `JoinTrip` (`GET/POST /trips/:id[/join]`)
- `src/components/motion.jsx` — `Reveal` / `StaggerContainer` / `StaggerItem` Framer Motion primitives
- MANIFEST design tokens in `src/styles/` — supports OS dark/light preference plus an explicit `data-theme` override

Not yet built: trip detail/itinerary view, preferences questionnaire, bookings, AI advisor, suggestions/approvals — see the project plan for phases 3–7.

## Deploy

Manual (first time, or to set up the real Firebase project):

```bash
firebase login
# set the real Firebase project id in .firebaserc first
npm run deploy   # build + firebase deploy
```

### CI/CD

`.github/workflows/deploy.yml` — push to `master` builds and deploys
straight to the Firebase Hosting `live` channel (no separate dev/prod split
on the frontend side, matching `the-gooners-world`'s pipeline — only merges
trigger a deploy, not pull requests).

Required GitHub Actions secrets:

| Secret                        | Description                                              |
|--------------------------------|------------------------------------------------------------|
| `VITE_COGNITO_USER_POOL_ID`    | from `trip-planner-api`'s deployed Cognito User Pool      |
| `VITE_COGNITO_CLIENT_ID`       | from `trip-planner-api`'s deployed Cognito User Pool Client|
| `VITE_API_BASE`                | `trip-planner-api`'s HTTP API base URL — point this at whichever backend stage (dev/prod) the live site should talk to |
| `FIREBASE_SERVICE_ACCOUNT`     | JSON key for a Firebase service account with Hosting deploy permission |

`.firebaserc` must have the real Firebase project id committed (not the
`REPLACE-ME` placeholder) before this workflow can deploy anywhere.
