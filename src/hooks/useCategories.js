import { useCallback, useEffect, useMemo, useState } from 'react'
import { CATEGORIES as BUILTIN_CATEGORIES } from '../utils/constants'
import * as api from '../utils/api'

export const PHOSPHOR_ICON_OPTIONS = [
  { id: 'Car', label: 'Transport' },
  { id: 'ForkKnife', label: 'Food' },
  { id: 'Gift', label: 'Gifts' },
  { id: 'UsersThree', label: 'Family' },
  { id: 'WifiHigh', label: 'Internet' },
  { id: 'Money', label: 'Salary' },
  { id: 'TrendUp', label: 'Invest' },
  { id: 'Wallet', label: 'Wallet' },
  { id: 'Package', label: 'Other' },
  { id: 'House', label: 'Home' },
  { id: 'Barbell', label: 'Fitness' },
  { id: 'Heart', label: 'Health' },
  { id: 'GraduationCap', label: 'Education' },
  { id: 'FilmStrip', label: 'Entertainment' },
  { id: 'ShoppingCart', label: 'Shopping' },
  { id: 'TShirt', label: 'Clothing' },
  { id: 'GameController', label: 'Games' },
  { id: 'Airplane', label: 'Travel' },
  { id: 'Book', label: 'Books' },
  { id: 'Coffee', label: 'Coffee' },
  { id: 'Bus', label: 'Transit' },
  { id: 'PiggyBank', label: 'Savings' },
  { id: 'FirstAid', label: 'Medical' },
  { id: 'Dog', label: 'Pets' },
]

export function useCategories() {
  const [custom, setCustom] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api.getCustomCategories()
        if (!cancelled) setCustom(data)
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const allCategories = useMemo(() => [...BUILTIN_CATEGORIES, ...custom], [custom])

  const getMeta = useCallback(
    (categoryId) =>
      allCategories.find((c) => c.id === categoryId) ??
      BUILTIN_CATEGORIES.find((c) => c.id === 'other_expense'),
    [allCategories],
  )

  const addCategory = useCallback(async ({ label, type, phosphor }) => {
    const entry = await api.createCustomCategory({
      label: label.trim(),
      phosphor: phosphor || 'Package',
      type: type || 'expense',
    })
    setCustom((prev) => [...prev, entry])
    return entry
  }, [])

  const deleteCategory = useCallback(async (id) => {
    await api.deleteCustomCategory(id)
    setCustom((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return {
    allCategories,
    customCategories: custom,
    getMeta,
    addCategory,
    deleteCategory,
    loading,
  }
}
