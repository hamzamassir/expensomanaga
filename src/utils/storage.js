import { v4 as uuidv4 } from 'uuid'
import {
  normalizeCategory,
  parseTransferAccounts,
  inferAccount,
} from './constants'

const STORAGE_KEY = 'expensomanaga_transactions'
const INIT_KEY = 'expensomanaga_initialized'
const MIGRATION_INTEREST_KEY = 'expensomanaga_mig_interest_savings'

const SEED_ROWS = `Date,Description,Amount (MAD),Type
2026-08-31,Transportation,5.0,Expense
2026-08-31,Food,59.0,Expense
2026-08-31,Main to Savings,7000.0,Transfer
2026-08-31,interest,5.56,Income
2026-08-31,Savings initial balance,3700.0,Previous Balance
2026-08-31,Salary,9089.0,Income
2026-08-31,internet,69.0,Expense
2026-09-01,Transportation,5.0,Expense
2026-09-01,Food,55.5,Expense
2026-09-01,Family,10.0,Expense
2026-09-02,Transportation,5.0,Expense
2026-09-02,Food,10.0,Expense
2026-09-02,Food,5.0,Expense
2026-09-02,Transportation,5.0,Expense
2026-09-04,gift,700.0,Expense
2026-09-04,Food,255.0,Expense
2026-09-05,Food,147.0,Expense
2026-09-05,Transportation,36.0,Expense
2026-09-08,Food,20.0,Expense
2026-09-08,Food,10.0,Expense
2026-09-08,Transportation,230.0,Expense
2026-09-08,Food,20.0,Expense
2026-09-08,Transportation,20.0,Expense
2026-09-08,gift,215.0,Expense
2026-09-08,Food,59.0,Expense
2026-09-09,Transportation,10.0,Expense
2026-09-09,Food,102.0,Expense
2026-09-09,Savings to Main,700.0,Transfer
2026-09-20,Food,650.0,Expense
2026-09-20,Transportation,267.09,Expense
2026-09-20,gift,1200.0,Expense
2026-09-20,Savings to Main,2000.0,Transfer`

function normalizeType(raw) {
  const t = raw.trim().toLowerCase()
  if (t === 'expense') return 'expense'
  if (t === 'income') return 'income'
  if (t === 'transfer') return 'transfer'
  if (t.includes('previous')) return 'previous_balance'
  return 'expense'
}

export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const header = lines[0].toLowerCase()
  const hasAccount = header.includes('account')

  return lines.slice(1).filter(Boolean).map((line) => {
    const parts = line.split(',')
    const date = parts[0]?.trim()
    const description = parts[1]?.trim()
    const amount = parseFloat(parts[2])
    const type = normalizeType(parts[3] ?? 'Expense')
    const accountCol = hasAccount ? parts[4]?.trim().toLowerCase() : null

    const category = normalizeCategory(description, type)
    let account = accountCol || inferAccount(description, type, category)
    if (accountCol === 'main account') account = 'main'

    let fromAccount = 'main'
    let toAccount = 'savings'

    if (type === 'transfer') {
      const parsed = parseTransferAccounts(description)
      fromAccount = parsed.fromAccount
      toAccount = parsed.toAccount
      account = fromAccount
    }

    return {
      id: uuidv4(),
      date,
      description,
      amount: Math.abs(amount),
      type,
      category,
      account,
      fromAccount,
      toAccount,
    }
  })
}

export function transactionsToCsv(transactions) {
  const header = 'Date,Description,Amount (MAD),Type,Account,Category'
  const rows = transactions.map((t) =>
    [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      t.type === 'transfer' ? `${t.fromAccount}->${t.toAccount}` : t.account,
      t.category,
    ].join(','),
  )
  return [header, ...rows].join('\n')
}

export function downloadCsv(transactions, filename = 'transactions.csv') {
  const blob = new Blob([transactionsToCsv(transactions)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function migrateTransactions(transactions) {
  return transactions.map((tx) => {
    const isInterest =
      tx.category === 'interest' || tx.description?.toLowerCase().includes('interest')
    if (isInterest && (tx.type === 'income' || tx.type === 'previous_balance')) {
      return { ...tx, account: 'savings', category: 'interest' }
    }
    return tx
  })
}

export function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      let data = JSON.parse(raw)
      if (!localStorage.getItem(MIGRATION_INTEREST_KEY)) {
        data = migrateTransactions(data)
        saveTransactions(data)
        localStorage.setItem(MIGRATION_INTEREST_KEY, '1')
      }
      return data
    }
  } catch {
    /* ignore */
  }
  return null
}

export function saveTransactions(transactions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
}

export function ensureSeedData() {
  if (localStorage.getItem(INIT_KEY)) {
    return loadTransactions() ?? []
  }
  const seeded = parseCsv(SEED_ROWS)
  saveTransactions(seeded)
  localStorage.setItem(INIT_KEY, '1')
  return seeded
}

export function applyTransactionToBalances(balances, tx) {
  const next = { ...balances }
  const amt = Number(tx.amount) || 0

  if (tx.type === 'expense') {
    next[tx.account] = (next[tx.account] ?? 0) - amt
  } else if (tx.type === 'income' || tx.type === 'previous_balance') {
    next[tx.account] = (next[tx.account] ?? 0) + amt
  } else if (tx.type === 'transfer') {
    next[tx.fromAccount] = (next[tx.fromAccount] ?? 0) - amt
    next[tx.toAccount] = (next[tx.toAccount] ?? 0) + amt
  }
  return next
}

export function computeBalances(transactions) {
  const balances = { main: 0, savings: 0, cash: 0 }
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.reduce(applyTransactionToBalances, balances)
}

export function computeMonthlySummary(transactions, month) {
  let income = 0
  let expenses = 0

  for (const tx of transactions) {
    if (monthKey(tx.date) !== month) continue
    if (tx.type === 'income' || tx.type === 'previous_balance') income += tx.amount
    if (tx.type === 'expense') expenses += tx.amount
  }

  return { income, expenses, net: income - expenses }
}

export function expenseByCategory(transactions, month = null) {
  const map = {}
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue
    if (month && monthKey(tx.date) !== month) continue
    map[tx.category] = (map[tx.category] ?? 0) + tx.amount
  }
  return Object.entries(map)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}

export function cashFlowByDay(transactions, month = null) {
  const map = {}
  for (const tx of transactions) {
    if (month && monthKey(tx.date) !== month) continue
    if (!map[tx.date]) map[tx.date] = { income: 0, expense: 0 }
    if (tx.type === 'income' || tx.type === 'previous_balance') map[tx.date].income += tx.amount
    if (tx.type === 'expense') map[tx.date].expense += tx.amount
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v, net: v.income - v.expense }))
}

function monthKey(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function filterTransactions(transactions, filters) {
  const { search, category, type, account, dateFrom, dateTo } = filters
  const q = search.trim().toLowerCase()

  return transactions.filter((tx) => {
    if (q && !tx.description.toLowerCase().includes(q) && !tx.category.includes(q)) return false
    if (category && tx.category !== category) return false
    if (type && tx.type !== type) return false
    if (account && tx.account !== account && tx.fromAccount !== account && tx.toAccount !== account) return false
    if (dateFrom && tx.date < dateFrom) return false
    if (dateTo && tx.date > dateTo) return false
    return true
  })
}

export function mockParseScreenshot(_file) {
  const today = new Date().toISOString().slice(0, 10)
  return [
    {
      id: uuidv4(),
      date: today,
      description: 'Coffee shop',
      amount: 25,
      type: 'expense',
      category: 'food',
      account: 'main',
      fromAccount: 'main',
      toAccount: 'savings',
    },
    {
      id: uuidv4(),
      date: today,
      description: 'Taxi ride',
      amount: 35,
      type: 'expense',
      category: 'transportation',
      account: 'main',
      fromAccount: 'main',
      toAccount: 'savings',
    },
    {
      id: uuidv4(),
      date: today,
      description: 'Grocery store',
      amount: 142.5,
      type: 'expense',
      category: 'food',
      account: 'main',
      fromAccount: 'main',
      toAccount: 'savings',
    },
  ]
}
