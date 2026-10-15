import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import AppShell from '../components/AppShell'
import { Icon } from '../components/Icon'
import { StaggerContainer, StaggerItem } from '../components/motion'
import TripTabs from '../components/TripTabs'
import { computeBalances, simplifyDebts } from '../utils/expenses'
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
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [splitBetween, setSplitBetween] = useState([])
  const [shares, setShares] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  useEffect(() => {
    if (!showForm) return
    setPaidBy(user?.userId || members[0]?.userId || '')
    setSplitBetween(members.map((m) => m.userId))
    setShares({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm])

  function toggleSplit(userId) {
    setSplitBetween((s) => (s.includes(userId) ? s.filter((id) => id !== userId) : [...s, userId]))
  }

  function adjustShare(userId, delta) {
    setShares((s) => ({ ...s, [userId]: Math.max(1, (s[userId] || 1) + delta) }))
  }

  async function handleAddExpense(e) {
    e.preventDefault()
    setFormError('')
    const amountNum = Number(amount)
    if (!description.trim()) return setFormError('Add a description.')
    if (!amountNum || amountNum <= 0) return setFormError('Enter an amount greater than 0.')
    if (splitBetween.length === 0) return setFormError('Split it between at least one person.')

    setIsSubmitting(true)
    try {
      const res = await api.post(`/trips/${tripId}/expenses`, {
        description: description.trim(),
        amount: amountNum,
        paidBy,
        splitBetween,
        shares: Object.fromEntries(splitBetween.map((id) => [id, shares[id] || 1])),
      })
      setExpenses((ex) => [...ex, res.expense])
      setDescription('')
      setAmount('')
      setShowForm(false)
    } catch (err) {
      setFormError(err.message || 'Could not add that expense.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(expenseId) {
    const prev = expenses
    setExpenses((ex) => ex.filter((e) => e.expenseId !== expenseId))
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
          <button className="btn small accent" type="button" onClick={() => setShowForm((s) => !s)}>
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
            <form className="panel glass" onSubmit={handleAddExpense}>
              {formError && <div className="error-banner">{formError}</div>}

              <div className="field">
                <label htmlFor="expDescription">What was it for?</label>
                <div className="field-input">
                  <Icon name="wallet" />
                  <input
                    id="expDescription"
                    required
                    placeholder="e.g. Dinner at Warung Sopa"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="row2">
                <div className="field">
                  <label htmlFor="expAmount">Amount</label>
                  <div className="field-input">
                    <Icon name="wallet" />
                    <input
                      id="expAmount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="expPaidBy">Paid by</label>
                  <div className="field-input">
                    <Icon name="users" />
                    <select id="expPaidBy" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {memberLabel(m.userId)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="field">
                <label>Split between</label>
                <div className="chip-grid">
                  {members.map((m) => (
                    <button
                      key={m.userId}
                      type="button"
                      className="chip"
                      aria-pressed={splitBetween.includes(m.userId)}
                      onClick={() => toggleSplit(m.userId)}
                    >
                      {memberLabel(m.userId)}
                    </button>
                  ))}
                </div>
                {splitBetween.length > 0 && (
                  <div className="share-steppers">
                    {splitBetween.map((userId) => (
                      <div className="share-row" key={userId}>
                        <span className="share-name">{memberLabel(userId)}</span>
                        <span className="share-stepper">
                          <button
                            type="button"
                            aria-label={`Fewer shares for ${memberLabel(userId)}`}
                            disabled={(shares[userId] || 1) <= 1}
                            onClick={() => adjustShare(userId, -1)}
                          >
                            −
                          </button>
                          <span className="share-count mono">{shares[userId] || 1}</span>
                          <button
                            type="button"
                            aria-label={`More shares for ${memberLabel(userId)}`}
                            onClick={() => adjustShare(userId, 1)}
                          >
                            +
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="q-actions">
                <button type="submit" className="btn accent" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding…' : 'Add expense'}
                  <Icon name="plus" />
                </button>
              </div>
            </form>
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
                  {expenses.map((exp) => (
                    <div className="ledger-row" key={exp.expenseId}>
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
                      <button
                        className="btn small ghost"
                        type="button"
                        aria-label={`Delete expense: ${exp.description}`}
                        onClick={() => handleDelete(exp.expenseId)}
                      >
                        <Icon name="x" />
                      </button>
                    </div>
                  ))}
                </div>
              </StaggerItem>
            </StaggerContainer>
          )}
        </>
      )}
    </AppShell>
  )
}
