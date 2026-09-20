export const ACCOUNTS = [
  { id: 'main', name: 'Main', remix: 'ri-bank-line' },
  { id: 'savings', name: 'Savings', remix: 'ri-safe-2-line' },
]

export const ACCOUNT_MAP = Object.fromEntries(ACCOUNTS.map((a) => [a.id, a]))

export const DEFAULT_TOP_EXPENSE_IDS = [
  'food',
  'transportation',
  'gifts',
  'family',
  'internet',
  'other_expense',
]

export const TRANSACTION_TYPES = [
  { id: 'expense', label: 'Expense', icon: 'ri-arrow-down-circle-line', color: 'text-expense' },
  { id: 'income', label: 'Income', icon: 'ri-arrow-up-circle-line', color: 'text-income' },
  { id: 'transfer', label: 'Transfer', icon: 'ri-arrow-left-right-line', color: 'text-transfer' },
  { id: 'previous_balance', label: 'Opening', icon: 'ri-flag-line', color: 'text-income' },
]

export const CATEGORIES = [
  { id: 'transportation', label: 'Transport', phosphor: 'Car', type: 'expense' },
  { id: 'food', label: 'Food', phosphor: 'ForkKnife', type: 'expense' },
  { id: 'gifts', label: 'Gifts', phosphor: 'Gift', type: 'expense' },
  { id: 'family', label: 'Family', phosphor: 'UsersThree', type: 'expense' },
  { id: 'internet', label: 'Internet', phosphor: 'WifiHigh', type: 'expense' },
  { id: 'salary', label: 'Salary', phosphor: 'Money', type: 'income' },
  { id: 'interest', label: 'Interest', phosphor: 'TrendUp', type: 'income' },
  { id: 'other_income', label: 'Other Income', phosphor: 'Wallet', type: 'income' },
  { id: 'other_expense', label: 'Other', phosphor: 'Package', type: 'expense' },
  { id: 'transfer', label: 'Transfer', phosphor: 'ArrowsLeftRight', type: 'transfer' },
  { id: 'previous_balance', label: 'Opening', phosphor: 'Flag', type: 'previous_balance' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

export function getTopExpenseCategories(transactions, allCategories, limit = 7) {
  const totals = {}
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue
    totals[tx.category] = (totals[tx.category] ?? 0) + tx.amount
  }

  const ranked = Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id)

  const expenseCats = allCategories.filter((c) => c.type === 'expense')
  const expenseIds = expenseCats.map((c) => c.id)
  const merged = [...ranked]

  for (const id of DEFAULT_TOP_EXPENSE_IDS) {
    if (!merged.includes(id) && expenseIds.includes(id)) merged.push(id)
  }
  for (const id of expenseIds) {
    if (!merged.includes(id)) merged.push(id)
  }

  return merged.slice(0, limit).map((id) => expenseCats.find((c) => c.id === id) ?? getCategoryMeta(id))
}

export function normalizeCategory(description, type) {
  const d = description.toLowerCase().trim()
  if (type === 'transfer') return 'transfer'
  if (type === 'previous_balance' || d.includes('initial balance')) return 'previous_balance'
  if (d.includes('salary')) return 'salary'
  if (d.includes('interest')) return 'interest'
  if (d.includes('transport')) return 'transportation'
  if (d.includes('food')) return 'food'
  if (d.includes('gift')) return 'gifts'
  if (d.includes('family')) return 'family'
  if (d.includes('internet')) return 'internet'
  if (type === 'income') return 'other_income'
  return 'other_expense'
}

export function getCategoryMeta(categoryId) {
  return CATEGORY_MAP[categoryId] ?? CATEGORY_MAP.other_expense
}

export function getTypeColor(type) {
  if (type === 'income' || type === 'previous_balance') return 'text-income'
  if (type === 'transfer') return 'text-transfer'
  return 'text-expense'
}

export function getTypeBg(type) {
  if (type === 'income' || type === 'previous_balance') return 'glass glass-income'
  if (type === 'transfer') return 'glass glass-transfer'
  return 'glass glass-expense'
}

export function formatMAD(amount) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr + 'T12:00:00'))
}

export function monthKey(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function parseTransferAccounts(description) {
  const d = description.toLowerCase()
  if (d.includes('main to savings')) return { fromAccount: 'main', toAccount: 'savings' }
  if (d.includes('savings to main')) return { fromAccount: 'savings', toAccount: 'main' }
  if (d.includes('cash to main') || d.includes('cash to savings')) {
    return d.includes('savings') ? { fromAccount: 'main', toAccount: 'savings' } : { fromAccount: 'main', toAccount: 'main' }
  }
  if (d.includes('main to cash')) return { fromAccount: 'main', toAccount: 'main' }
  return { fromAccount: 'main', toAccount: 'savings' }
}

export function inferAccount(description, type, category) {
  const d = description.toLowerCase()
  if (type === 'previous_balance' || d.includes('initial balance')) return 'savings'
  if (category === 'interest' || d.includes('interest')) return 'savings'
  if (d.includes('salary')) return 'main'
  return 'main'
}

export function resolveAccountForTx({ description, type, category, account }) {
  if (type === 'transfer') return account
  const resolved = inferAccount(description, type, category ?? normalizeCategory(description, type))
  if (category === 'interest' || description?.toLowerCase().includes('interest')) return 'savings'
  return resolved
}

export function amountPrefix(type) {
  if (type === 'income' || type === 'previous_balance') return '+'
  if (type === 'expense') return '-'
  return ''
}

export function normalizeAccountId(id) {
  if (!id || id === 'cash' || id === 'all') return id === 'all' ? 'all' : 'main'
  return id
}
