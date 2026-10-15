import { useState } from 'react'
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
  {
    icon: 'link',
    title: 'Talk to it from Claude',
    text: 'Connect Manifest to Claude Desktop and check your trip or log an expense by chatting.',
  },
]

// Not user-specific — every Manifest user connects to the same MCP server
// URL, then signs in with their own account during the Claude OAuth prompt.
// Safe to show here, before login.
const MCP_SERVER_URL = 'https://2nlpqpdko9.execute-api.us-east-1.amazonaws.com/mcp'

function ConnectToClaude() {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(MCP_SERVER_URL)
    } catch {
      window.prompt('Copy this MCP server URL:', MCP_SERVER_URL)
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="panel glass" style={{ marginTop: 22, padding: '16px 18px' }}>
      <p className="eyebrow" style={{ marginBottom: 8 }}>
        Connect to Claude
      </p>
      <p style={{ fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5, marginBottom: 12 }}>
        In Claude Desktop: <b>Settings → Connectors → Add custom connector</b>, paste the URL
        below, then sign in with your Manifest account when prompted. No account yet? Create one
        first, then connect.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <code
          className="mono"
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 12.5,
            padding: '8px 10px',
            borderRadius: 8,
            background: 'var(--surface-solid)',
            border: '1px solid var(--surface-border)',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {MCP_SERVER_URL}
        </code>
        <button className="btn small ghost" type="button" onClick={handleCopy}>
          <Icon name={copied ? 'check' : 'link'} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

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
      <ConnectToClaude />
    </div>
  )
}
