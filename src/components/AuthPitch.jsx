import { Icon } from './Icon'

// What Manifest actually does, in the group's own words — not generic
// marketing copy. Shown beside the login/register form so a new visitor
// knows what they're signing up for before they commit to an account.
const HIGHLIGHTS = [
  {
    icon: 'sparkle',
    title: 'AI-drafted itinerary',
    text: 'Grounded in real opening hours and travel times — not guesses.',
  },
  {
    icon: 'chat',
    title: 'Decide together',
    text: 'Suggest changes, approve the plan — nobody plans alone.',
  },
  {
    icon: 'sun',
    title: 'Live on the day',
    text: 'Check off the plan as you go, right from your phone.',
  },
  {
    icon: 'wallet',
    title: 'Split costs automatically',
    text: 'Log expenses as you spend; Manifest works out who owes who.',
  },
]

export default function AuthPitch() {
  return (
    <div className="auth-pitch">
      <p className="eyebrow">Manifest</p>
      <h1>Plan the trip. Actually agree on it.</h1>
      <p className="sub">
        Manifest turns a group chat spiral into one shared plan — AI drafts the itinerary,
        everyone suggests and approves changes, and the group tracks it together from the
        first booking to the last day.
      </p>
      <div className="pitch-list">
        {HIGHLIGHTS.map((h) => (
          <div className="pitch-row" key={h.title}>
            <span className="icon-badge">
              <Icon name={h.icon} />
            </span>
            <div className="txt">
              <b>{h.title}</b>
              {h.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
