import { useCallback, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { CATEGORIES as BUILTIN_CATEGORIES } from '../utils/constants'

const STORAGE_KEY = 'expensomanaga_custom_categories'

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

function loadCustom() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return []
}

function saveCustom(categories) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
}

export function useCategories() {
  const [custom, setCustom] = useState(() => loadCustom())

  const persist = useCallback((next) => {
    setCustom(next)
    saveCustom(next)
  }, [])

  const allCategories = useMemo(() => [...BUILTIN_CATEGORIES, ...custom], [custom])

  const getMeta = useCallback(
    (categoryId) =>
      allCategories.find((c) => c.id === categoryId) ?? BUILTIN_CATEGORIES.find((c) => c.id === 'other_expense'),
    [allCategories],
  )

  const addCategory = useCallback(
    ({ label, type, phosphor }) => {
      const id = `custom_${uuidv4().slice(0, 8)}`
      const entry = {
        id,
        label: label.trim(),
        phosphor: phosphor || 'Package',
        type: type || 'expense',
        custom: true,
      }
      persist([...custom, entry])
      return entry
    },
    [custom, persist],
  )

  const deleteCategory = useCallback(
    (id) => {
      persist(custom.filter((c) => c.id !== id))
    },
    [custom, persist],
  )

  return {
    allCategories,
    customCategories: custom,
    getMeta,
    addCategory,
    deleteCategory,
  }
}
