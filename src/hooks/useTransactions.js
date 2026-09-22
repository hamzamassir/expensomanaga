import { useCallback, useEffect, useMemo, useState } from 'react'
import * as api from '../utils/api'
import {
  computeBalances,
  computeMonthlySummary,
  filterTransactions,
} from '../utils/storage'
import { currentMonthKey, resolveAccountForTx } from '../utils/constants'

export function useTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeAccount, setActiveAccount] = useState('all')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const txs = await api.getTransactions()
        const migrated = await api.migrateLocalStorageIfNeeded(txs)
        if (!cancelled) setTransactions(migrated)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const addTransaction = useCallback(async (partial) => {
    const account = resolveAccountForTx(partial)
    const payload = {
      fromAccount: partial.fromAccount ?? partial.account ?? 'main',
      toAccount: partial.toAccount ?? 'savings',
      ...partial,
      account,
    }
    const tx = await api.createTransaction(payload)
    setTransactions((prev) => [tx, ...prev])
    return tx
  }, [])

  const updateTransaction = useCallback(async (id, updates) => {
    const tx = await api.updateTransaction(id, updates)
    setTransactions((prev) => prev.map((t) => (t.id === id ? tx : t)))
    return tx
  }, [])

  const deleteTransaction = useCallback(async (id) => {
    await api.deleteTransaction(id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const importTransactions = useCallback(async (incoming, mode = 'merge') => {
    const next = await api.bulkImportTransactions(incoming, mode)
    setTransactions(next)
  }, [])

  const reload = useCallback(async () => {
    const txs = await api.getTransactions()
    setTransactions(txs)
  }, [])

  const balances = useMemo(() => computeBalances(transactions), [transactions])
  const netWorth = useMemo(() => Object.values(balances).reduce((s, v) => s + v, 0), [balances])
  const monthSummary = useMemo(
    () => computeMonthlySummary(transactions, currentMonthKey(), activeAccount),
    [transactions, activeAccount],
  )

  return {
    transactions,
    loading,
    error,
    activeAccount,
    setActiveAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    reload,
    balances,
    netWorth,
    monthSummary,
    filter: (filters) => filterTransactions(transactions, filters),
  }
}
