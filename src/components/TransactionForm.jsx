import { useState } from 'react'
import RemixIcon from './icons/RemixIcon'
import { PresetCategoryIcon } from './icons/CategoryIcon'
import { useCategoriesContext } from '../context/CategoriesContext'
import {
  ACCOUNTS,
  ACCOUNT_MAP,
  TRANSACTION_TYPES,
  QUICK_PRESETS,
  parseTransferAccounts,
  inferAccount,
} from '../utils/constants'
import { parseMoneyInput } from '../utils/money'

const TRANSFER_PRESETS = [
  { label: 'Main → Savings', from: 'main', to: 'savings' },
  { label: 'Main → Cash', from: 'main', to: 'cash' },
  { label: 'Savings → Main', from: 'savings', to: 'main' },
  { label: 'Savings → Cash', from: 'savings', to: 'cash' },
  { label: 'Cash → Main', from: 'cash', to: 'main' },
]

const emptyForm = (activeAccount = 'main') => ({
  date: new Date().toISOString().slice(0, 10),
  description: '',
  amount: '',
  type: 'expense',
  category: 'food',
  account: activeAccount === 'all' ? 'main' : activeAccount,
  fromAccount: 'main',
  toAccount: 'savings',
})

function autoAccount(type, category, description) {
  if (type === 'transfer') return null
  if (type === 'previous_balance') return 'savings'
  return inferAccount(description, type, category)
}

export default function TransactionForm({ onAdd, onQuickAdd, activeAccount = 'all' }) {
  const { allCategories } = useCategoriesContext()
  const [form, setForm] = useState(() => emptyForm(activeAccount))
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('expense')

  const defaultAccount = activeAccount === 'all' ? 'main' : activeAccount

  const set = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }

      if (key === 'type') {
        if (value === 'transfer') next.category = 'transfer'
        else if (value === 'previous_balance') {
          next.category = 'previous_balance'
          next.account = 'savings'
        } else if (value === 'income') {
          next.category = 'salary'
          next.account = value === 'interest' ? 'savings' : defaultAccount
        }
      }

      if (key === 'category') {
        const acct = autoAccount(next.type, value, next.description)
        if (acct) next.account = acct
      }

      if (key === 'description') {
        if (prev.type === 'transfer') {
          const parsed = parseTransferAccounts(value)
          next.fromAccount = parsed.fromAccount
          next.toAccount = parsed.toAccount
          next.account = parsed.fromAccount
        } else {
          const acct = autoAccount(next.type, next.category, value)
          if (acct) next.account = acct
        }
      }

      return next
    })
  }

  const interestLocked = form.category === 'interest' || form.description.toLowerCase().includes('interest')

  const submit = (e) => {
    e.preventDefault()
    const amount = parseMoneyInput(form.amount)
    if (!form.description || amount == null || amount <= 0) return

    const account =
      form.type === 'transfer'
        ? form.fromAccount
        : autoAccount(form.type, form.category, form.description) ?? form.account

    onAdd({
      date: form.date,
      description: form.description,
      amount,
      type: form.type,
      category: form.category,
      account,
      fromAccount: form.fromAccount,
      toAccount: form.toAccount,
    })
    setForm(emptyForm(activeAccount))
    setOpen(false)
  }

  const startTransfer = (preset) => {
    setMode('transfer')
    setOpen(true)
    setForm({
      ...emptyForm(activeAccount),
      type: 'transfer',
      category: 'transfer',
      description: `${ACCOUNT_MAP[preset.from]?.name} to ${ACCOUNT_MAP[preset.to]?.name}`,
      fromAccount: preset.from,
      toAccount: preset.to,
      account: preset.from,
    })
  }

  const categoriesForType = allCategories.filter((c) => {
    if (form.type === 'transfer') return c.type === 'transfer'
    if (form.type === 'income' || form.type === 'previous_balance') {
      return c.type === 'income' || c.type === 'previous_balance'
    }
    return c.type === 'expense'
  })

  return (
    <div className="space-y-2 md:space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onQuickAdd(preset)}
            className="glass-subtle flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition active:scale-95 hover:glass-active md:px-3 md:text-xs"
          >
            <PresetCategoryIcon categoryId={preset.category} />
            {preset.label} {preset.amount}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TRANSFER_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => startTransfer(preset)}
            className="glass-transfer flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium text-transfer transition hover:glass-active"
          >
            <RemixIcon name="ri-arrow-left-right-line" className="text-sm" />
            {preset.label}
          </button>
        ))}
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => {
            setMode('expense')
            setOpen(true)
          }}
          className="glass-subtle flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-2.5 text-sm font-medium text-muted transition hover:glass-active hover:text-white md:py-3"
        >
          <RemixIcon name="ri-add-circle-line" className="text-base" />
          Add transaction
        </button>
      ) : (
        <form onSubmit={submit} className="glass rounded-2xl p-3 space-y-2.5 md:p-4 md:space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-0.5">
              <span className="text-[10px] text-muted md:text-xs">Date</span>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className="glass-input w-full rounded-xl px-2.5 py-2 text-sm outline-none md:px-3"
              />
            </label>
            <label className="space-y-0.5">
              <span className="text-[10px] text-muted md:text-xs">Type</span>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="glass-input w-full rounded-xl px-2.5 py-2 text-sm outline-none md:px-3"
              >
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-0.5">
            <span className="text-[10px] text-muted md:text-xs">Description</span>
            <input
              required
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={mode === 'transfer' ? 'Main to Savings' : 'Coffee, interest…'}
              className="glass-input w-full rounded-xl px-2.5 py-2 text-sm outline-none md:px-3"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-0.5">
              <span className="text-[10px] text-muted md:text-xs">Amount (MAD)</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                className="glass-input w-full rounded-xl px-2.5 py-2 text-sm outline-none md:px-3"
              />
            </label>
            <label className="space-y-0.5">
              <span className="text-[10px] text-muted md:text-xs">Category</span>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="glass-input w-full rounded-xl px-2.5 py-2 text-sm outline-none md:px-3"
              >
                {categoriesForType.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {form.type === 'transfer' ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-0.5">
                <span className="text-[10px] text-muted md:text-xs">From</span>
                <select
                  value={form.fromAccount}
                  onChange={(e) => set('fromAccount', e.target.value)}
                  className="glass-input w-full rounded-xl px-2.5 py-2 text-sm outline-none md:px-3"
                >
                  {ACCOUNTS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-0.5">
                <span className="text-[10px] text-muted md:text-xs">To</span>
                <select
                  value={form.toAccount}
                  onChange={(e) => set('toAccount', e.target.value)}
                  className="glass-input w-full rounded-xl px-2.5 py-2 text-sm outline-none md:px-3"
                >
                  {ACCOUNTS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <label className="block space-y-0.5">
              <span className="text-[10px] text-muted md:text-xs">
                Account {interestLocked && '(interest → Savings)'}
              </span>
              <select
                value={interestLocked ? 'savings' : form.account}
                disabled={interestLocked}
                onChange={(e) => set('account', e.target.value)}
                className="glass-input w-full rounded-xl px-2.5 py-2 text-sm outline-none disabled:opacity-70 md:px-3"
              >
                {ACCOUNTS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="flex gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setForm(emptyForm(activeAccount))
              }}
              className="glass-subtle flex-1 rounded-xl py-2 text-sm text-muted hover:text-white md:py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-income py-2 text-sm font-semibold text-black shadow-lg shadow-income/20 hover:bg-income/90 md:py-2.5"
            >
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
