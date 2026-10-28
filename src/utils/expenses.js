// Pure computation over already-fetched expenses/members — no reason for
// this to be a backend endpoint, it's just arithmetic on data the page
// already has.

// Net balance per member: positive = they're owed money, negative = they owe.
// `exp.shares` is optional (older expenses, or ones created before this
// existed, won't have it) — anyone without an explicit entry defaults to 1
// share, which collapses back to the original plain-even-split math.
//
// `settlements` are recorded "mark as paid" events (see ExpenseForm's
// sibling, the settle-up flow) — a payment outside the app that nets
// against a debt without touching the expense splits themselves. Balances
// are always recomputed from expenses + settlements rather than stored as a
// running total, so undoing a settlement (just deleting the record) is the
// entire undo — this function recomputing without it is what "readjusts"
// the balances back.
export function computeBalances(expenses, members, settlements = []) {
  const balances = {}
  for (const m of members) balances[m.userId] = 0
  for (const exp of expenses) {
    const shareCount = (userId) => exp.shares?.[userId] ?? 1
    const totalShares = exp.splitBetween.reduce((sum, userId) => sum + shareCount(userId), 0)
    const perShare = exp.amount / totalShares
    balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.amount
    for (const userId of exp.splitBetween) {
      balances[userId] = (balances[userId] || 0) - perShare * shareCount(userId)
    }
  }
  for (const s of settlements) {
    balances[s.fromUserId] = (balances[s.fromUserId] || 0) + s.amount
    balances[s.toUserId] = (balances[s.toUserId] || 0) - s.amount
  }
  return balances
}

// Per-person breakdown for a single expense — how much of the total each
// split member actually owes, honoring weighted shares the same way
// computeBalances does. Used to show "who's in on this and for how much"
// without the reader having to do the share-weighted math themselves.
export function expenseBreakdown(exp) {
  const shareCount = (userId) => exp.shares?.[userId] ?? 1
  const totalShares = exp.splitBetween.reduce((sum, id) => sum + shareCount(id), 0)
  const perShare = exp.amount / totalShares
  return exp.splitBetween.map((userId) => ({
    userId,
    shareCount: shareCount(userId),
    amount: Math.round(perShare * shareCount(userId) * 100) / 100,
  }))
}

// Quick stats for the Expenses page — total spend and how much each member
// has personally fronted (gross amount paid, not their net balance —
// someone can be the top spender and still be owed money, or vice versa).
// `topSpenderId` is null when there's nothing to compare (no expenses, or
// everyone's paid exactly the same).
export function expenseInsights(expenses, members) {
  const count = expenses.length
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  const paidByMember = {}
  for (const m of members) paidByMember[m.userId] = 0
  for (const exp of expenses) {
    paidByMember[exp.paidBy] = (paidByMember[exp.paidBy] || 0) + exp.amount
  }

  const ranked = Object.entries(paidByMember).sort((a, b) => b[1] - a[1])
  const topSpenderId = ranked.length && ranked[0][1] > 0 ? ranked[0][0] : null

  return { count, total, paidByMember, topSpenderId }
}

// Greedy settle-up: repeatedly match the largest creditor with the largest
// debtor. Not guaranteed minimal in every edge case, but close to it and
// simple — good enough for a trip-sized group, not a general min-transfers solver.
//
// A debtor can land multiple transactions (split across several creditors).
// Rounding each one to the nearest cent independently can make them sum to a
// cent off from that debtor's own once-rounded total — e.g. $64.795 + $2.515
// each round "correctly" to $64.80 + $2.52, which is $67.32, a cent more
// than their actual $67.31 owed. That mismatch is exactly what shows up as
// "the balance tile says $2.51 but settle-up says $2.52": two different
// numbers for what should be the same debt. The running `debtor.amount` stays
// full-precision throughout (only the *displayed* amount is rounded), so
// each debtor's last transaction is set to "their target total minus what's
// already been shown for them" instead of being rounded independently —
// guaranteeing their transactions always add up to exactly their balance.
export function simplifyDebts(balances) {
  const EPSILON = 0.01
  const creditors = []
  const debtors = []
  for (const [userId, amount] of Object.entries(balances)) {
    if (amount > EPSILON) creditors.push({ userId, amount })
    else if (amount < -EPSILON) debtors.push({ userId, amount: -amount })
  }
  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  for (const d of debtors) {
    d.target = Math.round(d.amount * 100) / 100
    d.shown = 0
  }

  const transactions = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(debtor.amount, creditor.amount)
    debtor.amount -= amount
    creditor.amount -= amount
    const isLastForDebtor = debtor.amount < EPSILON
    const displayAmount = isLastForDebtor
      ? Math.round((debtor.target - debtor.shown) * 100) / 100
      : Math.round(amount * 100) / 100
    debtor.shown += displayAmount
    transactions.push({ from: debtor.userId, to: creditor.userId, amount: displayAmount })
    if (isLastForDebtor) i++
    if (creditor.amount < EPSILON) j++
  }
  return transactions
}

// The settle-up list shown to the user — not simplifyDebts(balances) fed
// settlements directly. That would re-simplify the balances *after* each
// payment, and the greedy matcher has no memory of which pairing it chose
// last time: paying off "You owe Pallavi $64.80" in full can leave a small
// remainder that the next pass routes to a totally different creditor
// (e.g. Pallavi again, or Shrija disappearing), even though the amount is
// mathematically correct. That reads as broken — paying someone shouldn't
// make the app say you now owe a different person.
//
// Instead: simplify the RAW (pre-settlement) debts once to get a stable set
// of {from, to} pairs, then subtract whatever's been marked paid against
// each exact pair. A settlement always comes from "Mark as paid" on one of
// these specific pairs, so this keeps every other pair untouched no matter
// what happens to this one. (The Balances tiles stay driven by
// computeBalances(expenses, members, settlements) — each person's own net
// total is unaffected by any of this; only which pairings make up the
// settle-up list is.)
export function computeSettleUp(expenses, members, settlements = []) {
  const rawBalances = computeBalances(expenses, members)
  const base = simplifyDebts(rawBalances)

  const paidByPair = {}
  for (const s of settlements) {
    const key = `${s.fromUserId}→${s.toUserId}`
    paidByPair[key] = (paidByPair[key] || 0) + s.amount
  }

  return base
    .map((t) => ({
      ...t,
      amount: Math.round((t.amount - (paidByPair[`${t.from}→${t.to}`] || 0)) * 100) / 100,
    }))
    .filter((t) => t.amount > 0.01)
}
