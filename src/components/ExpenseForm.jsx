import { useState } from 'react'
import { api } from '../utils/api'
import { Icon } from './Icon'

// Add or edit a shared expense. Pass `expense` to edit an existing one
// (pre-fills the form and PUTs instead of POSTs); omit it to create.
// `onSaved` fires with the created/updated expense either way.
export default function ExpenseForm({ tripId, members, user, expense, onSaved, onCancel }) {
  const isEdit = !!expense
  const [description, setDescription] = useState(expense?.description || '')
  const [amount, setAmount] = useState(expense?.amount != null ? String(expense.amount) : '')
  const [paidBy, setPaidBy] = useState(expense?.paidBy || user?.userId || members[0]?.userId || '')
  const [splitBetween, setSplitBetween] = useState(expense?.splitBetween || members.map((m) => m.userId))
  const [shares, setShares] = useState(expense?.shares || {})
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function memberLabel(userId) {
    if (userId === user?.userId) return 'You'
    return members.find((m) => m.userId === userId)?.displayName || 'A traveler'
  }

  function toggleSplit(userId) {
    setSplitBetween((s) => (s.includes(userId) ? s.filter((id) => id !== userId) : [...s, userId]))
  }

  function adjustShare(userId, delta) {
    setShares((s) => ({ ...s, [userId]: Math.max(1, (s[userId] || 1) + delta) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const amountNum = Number(amount)
    if (!description.trim()) return setError('Add a description.')
    if (!amountNum || amountNum <= 0) return setError('Enter an amount greater than 0.')
    if (splitBetween.length === 0) return setError('Split it between at least one person.')

    setIsSubmitting(true)
    const payload = {
      description: description.trim(),
      amount: amountNum,
      paidBy,
      splitBetween,
      shares: Object.fromEntries(splitBetween.map((id) => [id, shares[id] || 1])),
    }
    try {
      const res = isEdit
        ? await api.put(`/trips/${tripId}/expenses/${expense.expenseId}`, payload)
        : await api.post(`/trips/${tripId}/expenses`, payload)
      onSaved?.(res.expense)
    } catch (err) {
      setError(err.message || `Could not ${isEdit ? 'save' : 'add'} that expense.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="panel glass" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

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
        {onCancel && (
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn accent" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add expense'}
          <Icon name={isEdit ? 'check' : 'plus'} />
        </button>
      </div>
    </form>
  )
}
