import { useCallback, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  ensureSeedData,
  saveTransactions,
  computeBalances,
  computeMonthlySummary,
  filterTransactions,
} from '../utils/storage'
import { currentMonthKey, resolveAccountForTx } from '../utils/constants'

export function useTransactions() {
  const [transactions, setTransactions] = useState(() => ensureSeedData())
  const [activeAccount, setActiveAccount] = useState('all')

  const persist = useCallback((next) => {
    setTransactions(next)
    saveTransactions(next)
  }, [])

  const addTransaction = useCallback(
    (partial) => {
      const account = resolveAccountForTx(partial)
      const tx = {
        id: uuidv4(),
        fromAccount: partial.fromAccount ?? partial.account ?? 'main',
        toAccount: partial.toAccount ?? 'savings',
        ...partial,
        account,
      }
      persist([tx, ...transactions])
      return tx
    },
    [transactions, persist],
  )

  const updateTransaction = useCallback(
    (id, updates) => {
      persist(transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)))
    },
    [transactions, persist],
  )

  const deleteTransaction = useCallback(
    (id) => {
      persist(transactions.filter((t) => t.id !== id))
    },
    [transactions, persist],
  )

  const importTransactions = useCallback(
    (incoming, mode = 'merge') => {
      if (mode === 'replace') {
        persist(incoming)
        return
      }
      const existingIds = new Set(transactions.map((t) => t.id))
      const merged = [...incoming.filter((t) => !existingIds.has(t.id)), ...transactions]
      merged.sort((a, b) => b.date.localeCompare(a.date))
      persist(merged)
    },
    [transactions, persist],
  )

  const balances = useMemo(() => computeBalances(transactions), [transactions])
  const netWorth = useMemo(() => Object.values(balances).reduce((s, v) => s + v, 0), [balances])
  const monthSummary = useMemo(
    () => computeMonthlySummary(transactions, currentMonthKey(), activeAccount),
    [transactions, activeAccount],
  )

  return {
    transactions,
    activeAccount,
    setActiveAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    balances,
    netWorth,
    monthSummary,
    filter: (filters) => filterTransactions(transactions, filters),
  }
}
