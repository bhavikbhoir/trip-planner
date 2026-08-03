// Pure computation over already-fetched expenses/members — no reason for
// this to be a backend endpoint, it's just arithmetic on data the page
// already has.

// Net balance per member: positive = they're owed money, negative = they owe.
export function computeBalances(expenses, members) {
  const balances = {}
  for (const m of members) balances[m.userId] = 0
  for (const exp of expenses) {
    const share = exp.amount / exp.splitBetween.length
    balances[exp.paidBy] = (balances[exp.paidBy] || 0) + exp.amount
    for (const userId of exp.splitBetween) {
      balances[userId] = (balances[userId] || 0) - share
    }
  }
  return balances
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
