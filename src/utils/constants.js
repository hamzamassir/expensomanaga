export const ACCOUNTS = [
  { id: 'main', name: 'Main Account', icon: '🏦' },
  { id: 'savings', name: 'Savings', icon: '🐷' },
  { id: 'cash', name: 'Cash', icon: '💵' },
]

export const ACCOUNT_MAP = Object.fromEntries(ACCOUNTS.map((a) => [a.id, a]))

export const TRANSACTION_TYPES = [
  { id: 'expense', label: 'Expense', color: 'text-expense' },
  { id: 'income', label: 'Income', color: 'text-income' },
  { id: 'transfer', label: 'Transfer', color: 'text-transfer' },
  { id: 'previous_balance', label: 'Previous Balance', color: 'text-income' },
]

export const CATEGORIES = [
  { id: 'transportation', label: 'Transportation', emoji: '🚗', type: 'expense' },
  { id: 'food', label: 'Food', emoji: '🍔', type: 'expense' },
  { id: 'gifts', label: 'Gifts', emoji: '🎁', type: 'expense' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧', type: 'expense' },
  { id: 'internet', label: 'Internet', emoji: '🌐', type: 'expense' },
  { id: 'salary', label: 'Salary', emoji: '💰', type: 'income' },
  { id: 'interest', label: 'Interest', emoji: '📈', type: 'income' },
  { id: 'other_income', label: 'Other Income', emoji: '💵', type: 'income' },
  { id: 'other_expense', label: 'Other', emoji: '📦', type: 'expense' },
  { id: 'transfer', label: 'Transfer', emoji: '↔️', type: 'transfer' },
  { id: 'previous_balance', label: 'Previous Balance', emoji: '🏁', type: 'previous_balance' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

export const QUICK_PRESETS = [
  { label: 'Transport', description: 'Transportation', amount: 5, category: 'transportation', emoji: '🚗' },
  { label: 'Coffee', description: 'Food', amount: 10, category: 'food', emoji: '☕' },
  { label: 'Lunch', description: 'Food', amount: 55, category: 'food', emoji: '🍔' },
  { label: 'Bus', description: 'Transportation', amount: 5, category: 'transportation', emoji: '🚌' },
]

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
  if (type === 'income' || type === 'previous_balance') return 'bg-income/10 border-income/30'
  if (type === 'transfer') return 'bg-transfer/10 border-transfer/30'
  return 'bg-expense/10 border-expense/30'
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
  if (d.includes('main to cash')) return { fromAccount: 'main', toAccount: 'cash' }
  if (d.includes('cash to main')) return { fromAccount: 'cash', toAccount: 'main' }
  if (d.includes('savings to cash')) return { fromAccount: 'savings', toAccount: 'cash' }
  if (d.includes('cash to savings')) return { fromAccount: 'cash', toAccount: 'savings' }
  return { fromAccount: 'main', toAccount: 'savings' }
}

export function inferAccount(description, type) {
  const d = description.toLowerCase()
  if (type === 'previous_balance' || d.includes('savings')) return 'savings'
  return 'main'
}
