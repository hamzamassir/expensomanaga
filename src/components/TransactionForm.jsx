import { useState } from 'react'
import { Plus, Zap } from 'lucide-react'
import {
  ACCOUNTS,
  CATEGORIES,
  TRANSACTION_TYPES,
  QUICK_PRESETS,
  parseTransferAccounts,
} from '../utils/constants'

const emptyForm = () => ({
  date: new Date().toISOString().slice(0, 10),
  description: '',
  amount: '',
  type: 'expense',
  category: 'food',
  account: 'main',
  fromAccount: 'main',
  toAccount: 'savings',
})

export default function TransactionForm({ onAdd, onQuickAdd }) {
  const [form, setForm] = useState(emptyForm)
  const [open, setOpen] = useState(false)

  const set = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'type') {
        if (value === 'transfer') next.category = 'transfer'
        else if (value === 'previous_balance') next.category = 'previous_balance'
        else if (value === 'income') next.category = 'salary'
      }
      if (key === 'description' && prev.type === 'transfer') {
        const parsed = parseTransferAccounts(value)
        next.fromAccount = parsed.fromAccount
        next.toAccount = parsed.toAccount
        next.account = parsed.fromAccount
      }
      return next
    })
  }

  const submit = (e) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!form.description || Number.isNaN(amount) || amount <= 0) return

    onAdd({
      date: form.date,
      description: form.description,
      amount,
      type: form.type,
      category: form.category,
      account: form.type === 'transfer' ? form.fromAccount : form.account,
      fromAccount: form.fromAccount,
      toAccount: form.toAccount,
    })
    setForm(emptyForm())
    setOpen(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onQuickAdd(preset)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition hover:border-income/40 hover:bg-income/5 active:scale-95"
          >
            <Zap className="h-3 w-3 text-income" />
            {preset.emoji} {preset.label} {preset.amount} MAD
          </button>
        ))}
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card py-3 text-sm font-medium text-muted transition hover:border-income/40 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Add transaction
        </button>
      ) : (
        <form
          onSubmit={submit}
          className="rounded-2xl border border-border bg-card p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-xs text-muted">Date</span>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className="w-full rounded-xl border border-border bg-charcoal px-3 py-2 text-sm outline-none focus:border-white/20"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted">Type</span>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="w-full rounded-xl border border-border bg-charcoal px-3 py-2 text-sm outline-none focus:border-white/20"
              >
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs text-muted">Description</span>
            <input
              required
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="e.g. Coffee, Main to Savings"
              className="w-full rounded-xl border border-border bg-charcoal px-3 py-2 text-sm outline-none focus:border-white/20"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-xs text-muted">Amount (MAD)</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                className="w-full rounded-xl border border-border bg-charcoal px-3 py-2 text-sm outline-none focus:border-white/20"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted">Category</span>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full rounded-xl border border-border bg-charcoal px-3 py-2 text-sm outline-none focus:border-white/20"
              >
                {CATEGORIES.filter(
                  (c) =>
                    form.type === 'transfer'
                      ? c.type === 'transfer'
                      : form.type === 'income' || form.type === 'previous_balance'
                        ? c.type === 'income' || c.type === 'previous_balance'
                        : c.type === 'expense',
                ).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {form.type === 'transfer' ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-xs text-muted">From</span>
                <select
                  value={form.fromAccount}
                  onChange={(e) => set('fromAccount', e.target.value)}
                  className="w-full rounded-xl border border-border bg-charcoal px-3 py-2 text-sm outline-none focus:border-white/20"
                >
                  {ACCOUNTS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.icon} {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted">To</span>
                <select
                  value={form.toAccount}
                  onChange={(e) => set('toAccount', e.target.value)}
                  className="w-full rounded-xl border border-border bg-charcoal px-3 py-2 text-sm outline-none focus:border-white/20"
                >
                  {ACCOUNTS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.icon} {a.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <label className="block space-y-1">
              <span className="text-xs text-muted">Account</span>
              <select
                value={form.account}
                onChange={(e) => set('account', e.target.value)}
                className="w-full rounded-xl border border-border bg-charcoal px-3 py-2 text-sm outline-none focus:border-white/20"
              >
                {ACCOUNTS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setForm(emptyForm())
              }}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm text-muted hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-income py-2.5 text-sm font-semibold text-black hover:bg-income/90"
            >
              Save
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
