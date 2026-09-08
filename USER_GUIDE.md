# Manifest — User Guide

Manifest is a collaborative trip planner: one group, one shared plan. An AI
drafts a real, data-grounded itinerary from what everyone actually wants,
the group negotiates changes together instead of over a dozen chat
messages, and the app follows the trip through to the actual days on the
ground and the final settle-up.

This guide walks through every feature — what it does, how to use it, why
it's worth using instead of a shared doc or a group chat, and anything
worth knowing about the data it touches. For the technical/API side, see
[`README.md`](./README.md); for the legal detail behind the privacy notes
below, see the in-app [Privacy Policy](/privacy) and [Terms of
Service](/terms).

---

## Contents

1. [Getting started](#1-getting-started)
2. [Accounts & sign-in](#2-accounts--sign-in)
3. [Creating and joining a trip](#3-creating-and-joining-a-trip)
4. [Preferences](#4-preferences)
5. [Itinerary](#5-itinerary)
6. [Day-of view](#6-day-of-view)
7. [Bookings](#7-bookings)
8. [Expenses](#8-expenses)
9. [Recap](#9-recap)
10. [Notifications](#10-notifications)
11. [Settings & theme](#11-settings--theme)
12. [Connecting Manifest to Claude](#12-connecting-manifest-to-claude)
13. [Privacy & compliance summary](#13-privacy--compliance-summary)
14. [FAQ](#14-faq)

---

## 1. Getting started

The fastest way to see the whole app is **"Try the demo"** on the login
screen — no account, no email, no backend calls. It runs entirely against
seeded sample data in your browser. Everything you can do in a real trip
(mark a day done, log an expense, view the recap) works in demo mode, and
nothing you do there is saved anywhere or sent to anyone. It resets the
moment you leave it.

When you're ready for a real trip, create an account (Section 2) — that's
the only way trip data actually persists and other people can join.

**Why it matters:** most trip-planning tools ask for an account before
you've seen anything. Letting you fully evaluate the product with zero
commitment, and zero data footprint, is both a better first impression and
a lighter privacy posture — there's nothing to protect, delete, or worry
about until you decide to sign up.

## 2. Accounts & sign-in

- **Register** with your name, email, and a password (8+ characters,
  upper- and lower-case, and a number). You'll get an email confirmation
  code to verify the address before you can sign in.
- **Sign in** with email + password.
- **Forgot password** sends a reset code to your email.
- Accounts are managed by AWS Cognito — Manifest itself never stores your
  password.

**Compliance note:** registering requires agreeing to the [Terms of
Service](/terms) and [Privacy Policy](/privacy), linked directly on the
sign-up form. Read Section 13 below for what account creation actually
collects.

## 3. Creating and joining a trip

- **Create a trip** from the dashboard: give it a name, destination, dates,
  and a trip type (e.g. leisure, family, adventure). You're the owner.
- **Invite people** with a shareable link from the trip. Anyone with the
  link can preview the trip's name/destination/member count *before*
  signing in, then join once they have an account.
- **Leave a trip** any time from the trip's member settings — except the
  owner, who deletes the trip instead of leaving it (since there'd be no
  one left to own it).
- **Edit trip details** (name/destination/dates/type) — owner-only, from
  the itinerary page's edit panel.

**Why it matters:** a shareable link (rather than emailing every member
individually) is the whole point of "collaborative" — anyone the group
already trusts enough to text a link to can join in one tap.

## 4. Preferences

Before (or after) the AI drafts a plan, each member fills in a short
questionnaire: food preferences and cuisines, activity interests, budget
pace, group dynamics, dislikes, and "must-dos." You can also add
**companions** — people traveling with you who won't have their own
Manifest account (kids, a partner, parents) — with just a name and age, so
the AI can pace the day appropriately (e.g. not scheduling a 6-hour hike
for a group with a toddler).

**Why it matters:** this is what actually personalizes the itinerary. A
generic "top 10 things to do in Rome" list doesn't know your group has two
vegetarians, a 4-year-old, and someone who hates museums — this does.

**Privacy note:** companion names/ages are visible only to the trip's other
members and are used only to inform pacing — see Section 13.

## 5. Itinerary

The core feature. Once enough preferences are in, any member can trigger
**AI-generated itinerary** — a day-by-day plan built from the group's
combined preferences, arrival/departure logistics, and any manual bookings
already on the trip.

What makes it more than a chatbot's guess:

- **Grounded in real data** — opening hours and nearby parking come from
  OpenStreetMap; driving times between stops come from OSRM's real routing
  engine; current weather comes from OpenWeatherMap. When the model can't
  verify something, it's labeled as an estimate rather than stated as fact.
- **Restaurant alternatives** — most meal events offer 1–2 swappable
  alternatives; any member can pick a different option for the group.
- **Suggestions & approvals** — anyone can suggest a change for the next
  version; the plan is "approved" once everyone has signed off, or the
  owner finalizes it directly.
- **Advisor tips** — a second, lighter-weight AI pass flags things worth a
  second look: does the itinerary match the hotel's location, is there a
  gap right after someone's flight lands, is a departure day too packed.
  Each tip can be dismissed or turned directly into a suggestion.
- **Regeneration** has a 30-second cooldown per trip (see Section 13 — this
  is a cost control, not a bug) and always produces a new plan version
  with fresh event IDs, so old picks/approvals don't carry over stale.

**Why it matters:** this replaces the "someone spends four hours on
TripAdvisor, pastes a list into the group chat, everyone half-reads it"
step with something the whole group actually negotiates and signs off on
together — and it's checked against real hours and travel times instead of
being a plausible-sounding guess.

## 6. Day-of view

Once the trip is underway, the **Today** tab defaults to the current day's
events (with Previous/Next navigation and a "jump back to Today" button, so
you can catch up on a day you forgot to check off). Each event gets one of
three states:

- **Done** — you did it.
- **Skipped** — you didn't, with an optional note why.
- **Did something else instead** — swapped for a different plan, also with
  an optional note.

These are mutually exclusive (an event is at most one of the three) and
feed directly into the post-trip Recap.

**Why it matters:** a plan is only useful if it survives contact with the
actual trip. This is the layer that turns "here's what we planned" into
"here's what we actually did," without extra bookkeeping — you're already
looking at this screen throughout the day.

## 7. Bookings

A dedicated tab for hotel, car, and other bookings — separate from the
AI-generated itinerary, since these are things you actually paid for and
want a single source of truth on. Any member can add, edit, or delete a
booking. Bookings you've logged also show up as read-only anchors on the
Itinerary timeline, so the AI-drafted plan is built around your actual
check-in/check-out times rather than ignoring them.

**Why it matters:** keeps your real commitments (confirmation numbers,
costs, dates) in one place that both drives and is respected by the AI
plan, instead of living in a separate email thread the itinerary can't see.

## 8. Expenses

Log a shared cost (who paid, how much, what it was for) and choose who it
splits across — defaults to the whole trip, but you can split a subset.
Manifest calculates running balances and a **debt-simplified settle-up**:
instead of "everyone pays everyone back individually," it works out the
minimum number of payments needed to zero everyone out.

**Why it matters:** this is the thing every group trip needs and almost
never does well until the last night, done badly, on napkin math. Doing it
continuously, with automatic simplification, means nobody's stuck doing
mental arithmetic at the airport.

## 9. Recap

Once a trip is marked complete (any member can do this — no approval
needed, and it can be undone by reopening the trip), the **Recap** tab
becomes available:

- Completion stats — how many events were done vs. skipped vs. swapped.
- A "what we did differently" list, pulled straight from your skip/swap
  notes.
- The final expense settle-up.
- A per-member mood + comment feedback form (`loved it` / `good` / `mixed`
  / `rough`).

**Why it matters:** most trip-planning tools have nothing after the trip
ends. This closes the loop — useful for the group's own memory, and
genuinely useful input if you ever plan a trip with the same people again.

## 10. Notifications

A bell icon in the top bar shows a live feed (polled every ~40s) of
trip activity: someone joined, someone suggested a change, the plan was
regenerated and needs your approval. Optionally, you can also opt into
**email** versions of similar events (see Section 13 for how that's gated).

## 11. Settings & theme

- **Display name** — update it once, and it syncs across every trip you're
  already part of.
- **Theme** — light ("paper boarding pass") or dark ("split-flap board"),
  toggled from the sun/moon icon in the top bar. Follows your OS preference
  by default; an explicit choice is saved to your account and follows you
  to another device (demo mode saves it locally only, since there's no
  account to sync to).

## 12. Connecting Manifest to Claude

Manifest exposes an OAuth-protected MCP (Model Context Protocol) server, so
you can talk to your trips from Claude Desktop: check a trip's status, mark
an event done, log an expense — all by chatting, without opening the app.
Set it up from **Claude Desktop → Settings → Connectors → Add custom
connector**, paste in the server URL shown on Manifest's login screen, and
sign in with your Manifest account when prompted.

**Why it matters:** it's a second interface to the same data, useful for
quick asks ("how much do I owe on the Lisbon trip?") without switching
apps — and it authenticates exactly like the web app does, through your own
Manifest account, so it can only ever see what you can already see.

## 13. Privacy & compliance summary

The full legal text lives at `/privacy` and `/terms` in the app (linked in
the footer of every page). The short version:

- **What's collected**: account info (name/email, via Cognito), the trip
  data you and your group enter (preferences, companions, logistics,
  bookings, expenses, feedback), and small usage logs used only to monitor
  the service.
- **AI processing**: itinerary/advisor generation is sent to AWS Bedrock
  (Claude models) as a processor, not used to train models. Real-world
  grounding data (hours, parking, routes, weather) comes from
  OpenStreetMap, OSRM, and OpenWeatherMap, queried by destination/
  coordinates only.
- **Email is opt-in, off by default**, with a one-click unsubscribe and a
  CAN-SPAM-compliant footer on every message. Turning it on/off is a
  Settings toggle, not a support request.
- **Companions** (Section 4) are entered by an adult for their own
  planning purposes and never become a separate account or profile — see
  the Privacy Policy's Children's Privacy section for the exact scope.
- **No ads, no data sales, no third-party tracking cookies.**
- **Your data, your control**: most information can be edited or deleted
  directly in the app (edit a trip, remove a booking/expense, leave a
  trip). Full self-service account deletion isn't built yet — email the
  contact address in the Privacy Policy to request an export or deletion
  in the meantime.
- **Cost/reliability guardrails you might notice**: the 30-second cooldown
  on itinerary/advisor generation exists because each call costs real
  money — it's not a bug, and it resets automatically.

## 14. FAQ

**Do I need an account to try Manifest?**
No — click "Try the demo" on the login screen.

**Can someone else see my expenses/companions/preferences if they're not on the trip?**
No. Trip data is visible only to that trip's members.

**What happens if I delete a trip?**
Everything tied to it — members, bookings, expenses, the plan, suggestions,
approvals, feedback — is deleted as one aggregate. This can't be undone.
Only the trip's owner can do this.

**What happens if I leave a trip instead?**
Only your own membership and logistics are removed; the trip and everyone
else's data are unaffected.

**Why didn't I get an email notification I turned on?**
Email delivery depends on the deployment having a verified sending
identity configured (see the API README's "Email setup" section) — if
that hasn't been completed yet, the app safely no-ops instead of failing,
and nothing sends until it is.

**Is the AI itinerary guaranteed to be accurate?**
No — treat opening hours, prices, and travel-time estimates as a strong
starting point to verify, not a guarantee. See Section 3 of the [Terms of
Service](/terms).
