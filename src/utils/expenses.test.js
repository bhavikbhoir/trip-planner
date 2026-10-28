import { describe, it, expect } from 'vitest'
import { computeBalances, simplifyDebts, expenseBreakdown } from './expenses'

const members = [{ userId: 'a' }, { userId: 'b' }, { userId: 'c' }, { userId: 'd' }]

describe('computeBalances', () => {
  it('nets to zero across all members regardless of expense count', () => {
    const expenses = [
      { amount: 48, paidBy: 'a', splitBetween: ['a', 'b', 'c', 'd'] },
      { amount: 20, paidBy: 'b', splitBetween: ['a', 'b'] },
      { amount: 15, paidBy: 'c', splitBetween: ['c', 'd'] },
    ]
    const balances = computeBalances(expenses, members)
    const total = Object.values(balances).reduce((sum, v) => sum + v, 0)
    expect(total).toBeCloseTo(0, 8)
  })

  it('gives a sole payer with no split partners their full amount back', () => {
    const expenses = [{ amount: 30, paidBy: 'a', splitBetween: ['a'] }]
    const balances = computeBalances(expenses, members)
    expect(balances.a).toBe(0)
    expect(balances.b).toBe(0)
  })

  it('credits the payer and debits every split member evenly', () => {
    const expenses = [{ amount: 40, paidBy: 'a', splitBetween: ['a', 'b', 'c', 'd'] }]
    const balances = computeBalances(expenses, members)
    expect(balances.a).toBe(30) // paid 40, owes 10 of it
    expect(balances.b).toBe(-10)
    expect(balances.c).toBe(-10)
    expect(balances.d).toBe(-10)
  })

  it('returns all-zero balances for an empty expense list', () => {
    const balances = computeBalances([], members)
    expect(Object.values(balances)).toEqual([0, 0, 0, 0])
  })

  it('weights a split member with extra shares — e.g. a +1 counted as 2', () => {
    // 90 split 4 ways but b carries 2 shares: 5 shares total, 18/share.
    const expenses = [{ amount: 90, paidBy: 'a', splitBetween: ['a', 'b', 'c', 'd'], shares: { b: 2 } }]
    const balances = computeBalances(expenses, members)
    expect(balances.a).toBe(72) // paid 90, owes 1 share (18)
    expect(balances.b).toBe(-36) // owes 2 shares
    expect(balances.c).toBe(-18)
    expect(balances.d).toBe(-18)
  })

  it('treats a split member missing from shares as 1 share', () => {
    const expenses = [{ amount: 30, paidBy: 'a', splitBetween: ['a', 'b'], shares: { a: 2 } }]
    const balances = computeBalances(expenses, members)
    expect(balances.a).toBe(10) // paid 30, owes 2 of 3 shares (20)
    expect(balances.b).toBe(-10) // owes 1 of 3 shares
  })

  it('still nets to zero with mixed shares across several expenses', () => {
    const expenses = [
      { amount: 90, paidBy: 'a', splitBetween: ['a', 'b', 'c', 'd'], shares: { b: 2 } },
      { amount: 20, paidBy: 'c', splitBetween: ['c', 'd'], shares: { d: 3 } },
    ]
    const balances = computeBalances(expenses, members)
    const total = Object.values(balances).reduce((sum, v) => sum + v, 0)
    expect(total).toBeCloseTo(0, 8)
  })
})

describe('simplifyDebts', () => {
  it('produces no transactions when everyone is already settled', () => {
    expect(simplifyDebts({ a: 0, b: 0.001, c: -0.001 })).toEqual([])
  })

  it('matches a single debtor directly to a single creditor', () => {
    const result = simplifyDebts({ a: 20, b: -20 })
    expect(result).toEqual([{ from: 'b', to: 'a', amount: 20 }])
  })

  it('settles every balance to zero for a multi-party split', () => {
    const balances = { a: 30, b: -10, c: -10, d: -10 }
    const transactions = simplifyDebts(balances)

    const net = { ...balances }
    for (const t of transactions) {
      net[t.from] += t.amount
      net[t.to] -= t.amount
    }
    for (const amount of Object.values(net)) {
      expect(Math.abs(amount)).toBeLessThan(0.01)
    }
  })

  it('rounds transaction amounts to the nearest cent', () => {
    const result = simplifyDebts({ a: 33.335, b: -33.335 })
    expect(result[0].amount).toBe(33.34)
  })
})

describe('expenseBreakdown', () => {
  it('splits evenly across every split member when no shares are given', () => {
    const exp = { amount: 40, splitBetween: ['a', 'b', 'c', 'd'] }
    expect(expenseBreakdown(exp)).toEqual([
      { userId: 'a', shareCount: 1, amount: 10 },
      { userId: 'b', shareCount: 1, amount: 10 },
      { userId: 'c', shareCount: 1, amount: 10 },
      { userId: 'd', shareCount: 1, amount: 10 },
    ])
  })

  it('weights a member with extra shares', () => {
    const exp = { amount: 90, splitBetween: ['a', 'b', 'c', 'd'], shares: { b: 2 } }
    expect(expenseBreakdown(exp)).toEqual([
      { userId: 'a', shareCount: 1, amount: 18 },
      { userId: 'b', shareCount: 2, amount: 36 },
      { userId: 'c', shareCount: 1, amount: 18 },
      { userId: 'd', shareCount: 1, amount: 18 },
    ])
  })

  it('sums back to the original amount within rounding', () => {
    const exp = { amount: 100, splitBetween: ['a', 'b', 'c'], shares: { a: 2 } }
    const total = expenseBreakdown(exp).reduce((sum, b) => sum + b.amount, 0)
    expect(total).toBeCloseTo(100, 1)
  })
})
