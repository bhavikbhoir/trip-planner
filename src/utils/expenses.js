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

  const transactions = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(debtor.amount, creditor.amount)
    transactions.push({ from: debtor.userId, to: creditor.userId, amount: Math.round(amount * 100) / 100 })
    debtor.amount -= amount
    creditor.amount -= amount
    if (debtor.amount < EPSILON) i++
    if (creditor.amount < EPSILON) j++
  }
  return transactions
}
