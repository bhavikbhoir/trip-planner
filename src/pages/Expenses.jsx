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
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function memberLabel(userId) {
    if (userId === user?.userId) return 'You'
    return members.find((m) => m.userId === userId)?.displayName || 'A traveler'
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm])

  function toggleSplit(userId) {
    setSplitBetween((s) => (s.includes(userId) ? s.filter((id) => id !== userId) : [...s, userId]))
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
          <h1 style={{ fontSize: '1.15rem', marginTop: 4 }}>{trip?.name || 'Loading…'}</h1>
        </div>
        <div className="itin-actions">
          <button className="btn small accent" type="button" onClick={() => setShowForm((s) => !s)}>
            <Icon name="plus" />
            {showForm ? 'Cancel' : 'Add expense'}
          </button>
        </div>
      </div>

      <TripTabs tripId={tripId} active="expenses" showToday />

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
              </div>

              <div className="q-actions">
                <button type="submit" className="btn accent" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding…' : 'Add expense'}
                  <Icon name="plus" />
                </button>
              </div>
            </form>
          )}

          <div className="panel glass" style={{ marginTop: showForm ? 16 : 0, marginBottom: 16 }}>
            {members.map((m) => {
              const net = balances[m.userId] || 0
              const settled = Math.abs(net) < 0.01
              return (
                <div className="anchor-row" key={m.userId}>
                  <span className="icon-badge" style={{ color: settled ? undefined : net > 0 ? 'var(--data)' : 'var(--warn)' }}>
                    <Icon name={settled ? 'check' : net > 0 ? 'plus' : 'x'} />
                  </span>
                  <span>
                    {memberLabel(m.userId)} —{' '}
                    {settled ? 'settled up' : net > 0 ? `is owed ${fmtMoney(net)}` : `owes ${fmtMoney(net)}`}
                  </span>
                </div>
              )
            })}
          </div>

          {settleUp.length > 0 && (
            <div className="panel glass" style={{ marginBottom: 16 }}>
              <p className="eyebrow" style={{ marginBottom: 10 }}>
                Settle up
              </p>
              {settleUp.map((t, i) => (
                <div className="anchor-row" key={i}>
                  <span className="icon-badge">
                    <Icon name="wallet" />
                  </span>
                  <span>
                    {memberLabel(t.from)} owes {memberLabel(t.to)} {fmtMoney(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {expenses.length === 0 ? (
            <div className="panel glass empty-state">
              <Icon name="wallet" />
              <p>No expenses logged yet.</p>
            </div>
          ) : (
            <StaggerContainer>
              <StaggerItem className="day-block">
                {expenses.map((exp) => (
                  <div className="event" key={exp.expenseId}>
                    <span className="event-node">
                      <Icon name="wallet" />
                    </span>
                    <div className="event-body">
                      <div className="desc">
                        {exp.description}
                        <span className="event-cost mono">{fmtMoney(exp.amount)}</span>
                      </div>
                      <div className="note">
                        Paid by {memberLabel(exp.paidBy)} · split {exp.splitBetween.length} way
                        {exp.splitBetween.length === 1 ? '' : 's'}
                      </div>
                    </div>
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
              </StaggerItem>
            </StaggerContainer>
          )}
        </>
      )}
    </AppShell>
  )
}
