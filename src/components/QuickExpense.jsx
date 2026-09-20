import { useMemo, useState } from 'react'
import { useCategoriesContext } from '../context/CategoriesContext'
import CategoryIcon from './icons/CategoryIcon'
import { getTopExpenseCategories } from '../utils/constants'
import { parseMoneyInput } from '../utils/money'

export default function QuickExpense({ transactions, defaultAccount, onAdd, onDone }) {
  const { allCategories, getMeta } = useCategoriesContext()
  const [picked, setPicked] = useState(null)
  const [amount, setAmount] = useState('')

  const top7 = useMemo(
    () => getTopExpenseCategories(transactions, allCategories, 7),
    [transactions, allCategories],
  )

  const submit = () => {
    const val = parseMoneyInput(amount)
    if (!picked || val == null || val <= 0) return
    const meta = getMeta(picked)
    onAdd({
      date: new Date().toISOString().slice(0, 10),
      description: meta.label,
      amount: val,
      type: 'expense',
      category: picked,
      account: defaultAccount,
    })
    setPicked(null)
    setAmount('')
    onDone?.(meta.label)
  }

  if (picked) {
    const meta = getMeta(picked)
    return (
      <div className="glass rounded-2xl p-3 space-y-3 md:p-4">
        <div className="flex items-center gap-3">
          <div className="glass-expense flex h-12 w-12 items-center justify-center rounded-xl">
            <CategoryIcon categoryId={picked} size={26} weight="fill" className="text-expense" />
          </div>
          <div>
            <p className="text-sm font-semibold">{meta.label}</p>
            <p className="text-[11px] text-muted">Enter amount · {defaultAccount === 'savings' ? 'Savings' : 'Main'}</p>
          </div>
        </div>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          autoFocus
          placeholder="Amount MAD"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="glass-input w-full rounded-xl px-3 py-3 text-lg font-semibold tabular-nums outline-none"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setPicked(null)
              setAmount('')
            }}
            className="glass-subtle flex-1 rounded-xl py-2.5 text-sm text-muted"
          >
            Back
          </button>
          <button
            type="button"
            onClick={submit}
            className="flex-1 rounded-xl bg-income py-2.5 text-sm font-semibold text-black"
          >
            OK
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-3 md:p-4">
      <p className="mb-2 text-xs font-medium text-muted">Quick expense · tap category</p>
      <div className="grid grid-cols-4 gap-2">
        {top7.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setPicked(cat.id)}
            className="glass-subtle flex flex-col items-center gap-1 rounded-xl border border-white/10 p-2.5 transition active:scale-95 hover:glass-active"
          >
            <CategoryIcon categoryId={cat.id} size={24} weight="fill" />
            <span className="w-full truncate text-center text-[10px]">{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
