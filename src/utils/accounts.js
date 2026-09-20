export function txBelongsToAccount(tx, accountId) {
  if (!accountId || accountId === 'all') return true
  if (tx.type === 'transfer') {
    return tx.fromAccount === accountId || tx.toAccount === accountId
  }
  return tx.account === accountId
}

export function filterByAccount(transactions, accountId) {
  if (!accountId || accountId === 'all') return transactions
  return transactions.filter((tx) => txBelongsToAccount(tx, accountId))
}
