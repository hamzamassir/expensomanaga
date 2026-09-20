import { useMemo, useState } from 'react'
import RemixIcon from './icons/RemixIcon'
import { useCategoriesContext } from '../context/CategoriesContext'
import { CategoryPicker, TypeChipPicker, AccountChipPicker } from './CategoryPicker'
import {
  ACCOUNTS,
  TRANSACTION_TYPES,
  getTopExpenseCategories,
  inferAccount,
} from '../utils/constants'
import { parseMoneyInput } from '../utils/money'

const FORM_TYPES = TRANSACTION_TYPES.filter((t) => t.id !== 'transfer')

function autoAccount(type, category, description, defaultExpenseAccount) {
  if (type === 'transfer') return null
  if (type === 'previous_balance') return 'savings'
  if (type === 'expense') return defaultExpenseAccount
  return inferAccount(description, type, category)
}

export default function TransactionForm({
  onAdd,
  transactions,
  defaultExpenseAccount = 'main',
  showQuick = false,
  onDone,
}) {
  const { allCategories, getMeta } = useCategoriesContext()
  const [open, setOpen] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    amount: '',
    type: 'expense',
    category: 'food',
    account: defaultExpenseAccount,
  })

  const top7 = useMemo(
    () => getTopExpenseCategories(transactions ?? [], allCategories, 7),
    [transactions, allCategories],
  )

  const incomeCategories = allCategories.filter(
    (c) => c.type === 'income' || c.type === 'previous_balance',
  )

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const onTypeChange = (type) => {
    const next = { type }
    if (type === 'expense') {
      next.category = form.category === 'transfer' ? 'food' : form.category
      next.account = defaultExpenseAccount
    } else if (type === 'income') {
      next.category = 'salary'
      next.account = 'main'
    } else if (type === 'previous_balance') {
      next.category = 'previous_balance'
      next.account = 'savings'
    }
    set(next)
  }

  const interestLocked = form.category === 'interest'

  const submit = (e) => {
    e.preventDefault()
    const amount = parseMoneyInput(form.amount)
    if (amount == null || amount <= 0) return

    const meta = getMeta(form.category)
    const description = form.description.trim() || meta.label
    const account =
      form.type === 'expense'
        ? defaultExpenseAccount
        : autoAccount(form.type, form.category, description, defaultExpenseAccount) ?? form.account

    onAdd({
      date: form.date,
      description,
      amount,
      type: form.type,
      category: form.category,
      account: interestLocked ? 'savings' : account,
      fromAccount: account,
      toAccount: 'savings',
    })

    set({
      description: '',
      amount: '',
      type: 'expense',
      category: 'food',
      account: defaultExpenseAccount,
    })
    setShowNote(false)
    setOpen(false)
    onDone?.()
  }

  if (!open) {
    if (!showQuick) {
      return (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="glass-subtle flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-2.5 text-sm font-medium text-muted transition hover:glass-active hover:text-white"
        >
          <RemixIcon name="ri-add-circle-line" className="text-base" />
          Add income or opening balance
        </button>
      )
    }
    return null
  }

  return (
    <form onSubmit={submit} className="glass rounded-2xl p-3 space-y-3 md:p-4">
      <TypeChipPicker value={form.type} onChange={onTypeChange} types={FORM_TYPES} />

      {form.type === 'expense' ? (
        <CategoryPicker
          topCategories={top7}
          value={form.category}
          onChange={(id) => set({ category: id })}
        />
      ) : (
        <CategoryPicker
          categories={incomeCategories}
          topCategories={incomeCategories.slice(0, 7)}
          value={form.category}
          onChange={(id) => {
            const patch = { category: id }
            if (id === 'interest') patch.account = 'savings'
            set(patch)
          }}
        />
      )}

      <input
        type="number"
        required
        min="0.01"
        step="0.01"
        inputMode="decimal"
        placeholder="Amount MAD"
        value={form.amount}
        onChange={(e) => set({ amount: e.target.value })}
        className="glass-input w-full rounded-xl px-3 py-3 text-lg font-semibold tabular-nums outline-none"
      />

      <input
        type="date"
        value={form.date}
        onChange={(e) => set({ date: e.target.value })}
        className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none"
      />

      {form.type !== 'expense' && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted">Account</p>
          <AccountChipPicker
            accounts={ACCOUNTS}
            value={interestLocked ? 'savings' : form.account}
            onChange={(id) => set({ account: id })}
          />
        </div>
      )}

      {!showNote ? (
        <button type="button" onClick={() => setShowNote(true)} className="text-[11px] text-transfer hover:underline">
          Add description (optional)
        </button>
      ) : (
        <input
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Optional description"
          className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none"
        />
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setShowNote(false)
          }}
          className="glass-subtle flex-1 rounded-xl py-2.5 text-sm text-muted"
        >
          Cancel
        </button>
        <button type="submit" className="flex-1 rounded-xl bg-income py-2.5 text-sm font-semibold text-black">
          Save
        </button>
      </div>
    </form>
  )
}
