import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import { StaggerContainer, StaggerItem } from '../components/motion'
import TripTabs from '../components/TripTabs'
import ExpenseForm from '../components/ExpenseForm'
import { computeBalances, simplifyDebts, expenseBreakdown } from '../utils/expenses'
import './pages.scss'

function fmtMoney(n) {
  return `$${Math.abs(n).toFixed(2)}`
}

export default function Expenses() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const [trip, setTrip] = useState(null)
  const [members, setMembers] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  function memberLabel(userId) {
    if (userId === user?.userId) return 'You'
    return members.find((m) => m.userId === userId)?.displayName || 'A traveler'
  }

  // See Itinerary.jsx — memberLabel resolving to "You" breaks subject-verb
  // agreement against a third-person verb ("You owes", "You is owed").
  function verbFor(userId, thirdPerson, secondPerson) {
    return userId === user?.userId ? secondPerson : thirdPerson
  }

  // Plain "split N ways" for the common even split; once anyone carries
  // extra shares that phrasing would be misleading (balances aren't equal
  // even though N people are listed), so it switches to naming the share
  // count instead.
  function splitLabel(exp) {
    const peopleCount = exp.splitBetween.length
    const totalShares = exp.splitBetween.reduce((sum, id) => sum + (exp.shares?.[id] || 1), 0)
    if (totalShares === peopleCount) return `split ${peopleCount} way${peopleCount === 1 ? '' : 's'}`
    return `split ${totalShares} shares among ${peopleCount} people`
  }

  async function loadTrip() {
    const res = await api.get(`/trips/${tripId}`)
    setTrip(res.trip)
    setMembers(res.members || [])
    setExpenses(res.expenses || [])
    return res
  }

  useEffect(() => {
    setLoading(true)
    loadTrip()
      .catch((e) => setLoadError(e.message || 'Could not load expenses.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  function handleAdded(expense) {
    setExpenses((ex) => [...ex, expense])
    setShowForm(false)
  }

  function handleUpdated(expense) {
    setExpenses((ex) => ex.map((e) => (e.expenseId === expense.expenseId ? expense : e)))
    setEditingId(null)
  }

  async function handleDelete(expenseId) {
    const prev = expenses
    setExpenses((ex) => ex.filter((e) => e.expenseId !== expenseId))
    if (editingId === expenseId) setEditingId(null)
    try {
      await api.delete(`/trips/${tripId}/expenses/${expenseId}`)
    } catch {
      setExpenses(prev)
    }
  }

  const balances = computeBalances(expenses, members)
  const settleUp = simplifyDebts(balances)

  return (
    <AppShell>
      <div className="itin-head">
        <div>
          <div className="eyebrow plan-badge">
            <Icon name="wallet" />
            Expenses
          </div>
          <h1 className="page-title" style={{ marginTop: 4 }}>{trip?.name || 'Loading…'}</h1>
        </div>
        <div className="itin-actions">
          <button
            className="btn small accent"
            type="button"
            onClick={() => {
              setEditingId(null)
              setShowForm((s) => !s)
            }}
          >
            <Icon name="plus" />
            {showForm ? 'Cancel' : 'Add expense'}
          </button>
        </div>
      </div>

      <TripTabs tripId={tripId} active="expenses" showToday showRecap={!!trip?.completedAt} />

      {loading && (
        <div className="panel glass" style={{ padding: 24 }}>
          <p className="eyebrow">Loading…</p>
        </div>
      )}

      {!loading && loadError && <div className="error-banner">{loadError}</div>}

      {!loading && !loadError && (
        <>
          {showForm && (
            <ExpenseForm
              tripId={tripId}
              members={members}
              user={user}
              onSaved={handleAdded}
              onCancel={() => setShowForm(false)}
            />
          )}

          <p className="eyebrow" style={{ marginTop: showForm ? 16 : 0, marginBottom: 10 }}>
            Balances
          </p>
          <div className="balance-tiles">
            {members.map((m) => {
              const net = balances[m.userId] || 0
              const settled = Math.abs(net) < 0.01
              const mood = settled ? 'settled' : net > 0 ? 'positive' : 'negative'
              return (
                <div className="balance-tile" key={m.userId}>
                  <span className="balance-name">{memberLabel(m.userId)}</span>
                  <span className={`balance-amount ${mood}`}>{settled ? '—' : fmtMoney(net)}</span>
                  <span className="balance-label">
                    {settled
                      ? 'Settled up'
                      : net > 0
                        ? `${verbFor(m.userId, 'is', 'are')} owed`
                        : `${verbFor(m.userId, 'owes', 'owe')}`}
                  </span>
                </div>
              )
            })}
          </div>

          {settleUp.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: 20, marginBottom: 10 }}>
                Settle up
              </p>
              <div className="settle-list">
                {settleUp.map((t, i) => (
                  <div className="settle-row" key={i}>
                    <span className="settle-names">
                      {memberLabel(t.from)} <Icon name="route" className="settle-arrow" /> {memberLabel(t.to)}
                    </span>
                    <span className="settle-amount mono">{fmtMoney(t.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="eyebrow" style={{ marginTop: 20, marginBottom: 10 }}>
            Expense log
          </p>
          {expenses.length === 0 ? (
            <div className="panel glass empty-state">
              <Icon name="wallet" />
              <p>No expenses logged yet.</p>
            </div>
          ) : (
            <StaggerContainer>
              <StaggerItem>
                <div className="ledger panel glass">
                  {expenses.map((exp) => {
                    if (editingId === exp.expenseId) {
                      return (
                        <div className="ledger-edit" key={exp.expenseId}>
                          <ExpenseForm
                            tripId={tripId}
                            members={members}
                            user={user}
                            expense={exp}
                            onSaved={handleUpdated}
                            onCancel={() => setEditingId(null)}
                          />
                        </div>
                      )
                    }

                    const expanded = expandedId === exp.expenseId
                    return (
                      <div className="ledger-entry" key={exp.expenseId}>
                        <div className="ledger-row">
                          <span className="ledger-icon">
                            <Icon name="wallet" />
                          </span>
                          <div className="ledger-info">
                            <div className="ledger-desc">{exp.description}</div>
                            <div className="ledger-meta">
                              Paid by {memberLabel(exp.paidBy)} · {splitLabel(exp)}
                            </div>
                          </div>
                          <span className="ledger-amount mono">{fmtMoney(exp.amount)}</span>
                        </div>
                        <div className="ledger-actions">
                          <button
                            type="button"
                            className={`btn small ghost ledger-who-toggle${expanded ? ' open' : ''}`}
                            aria-expanded={expanded}
                            onClick={() => setExpandedId(expanded ? null : exp.expenseId)}
                          >
                            Who's in
                            <Icon name="chevron" className="chev" />
                          </button>
                          <button
                            className="btn small ghost"
                            type="button"
                            onClick={() => {
                              setShowForm(false)
                              setEditingId(exp.expenseId)
                            }}
                          >
                            <Icon name="sliders" />
                            Edit
                          </button>
                          <button
                            className="btn small ghost"
                            type="button"
                            aria-label={`Delete expense: ${exp.description}`}
                            onClick={() => handleDelete(exp.expenseId)}
                          >
                            <Icon name="x" />
                          </button>
                        </div>
                        {expanded && (
                          <div className="ledger-breakdown">
                            {expenseBreakdown(exp).map((b) => (
                              <div className="ledger-breakdown-row" key={b.userId}>
                                <span>
                                  {memberLabel(b.userId)}
                                  {b.shareCount > 1 ? ` · ${b.shareCount} shares` : ''}
                                </span>
                                <span className="mono">{fmtMoney(b.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </StaggerItem>
            </StaggerContainer>
          )}
        </>
      )}
    </AppShell>
  )
}
