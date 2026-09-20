import { useState } from 'react'
import RemixIcon from './icons/RemixIcon'
import { ACCOUNTS, ACCOUNT_MAP } from '../utils/constants'
import { AccountChipPicker } from './CategoryPicker'
import { parseMoneyInput } from '../utils/money'

const PRESETS = [
  { from: 'main', to: 'savings', label: 'Main → Savings' },
  { from: 'savings', to: 'main', label: 'Savings → Main' },
]

export default function TransferPanel({ onAdd, onDone }) {
  const [fromAccount, setFromAccount] = useState('main')
  const [toAccount, setToAccount] = useState('savings')
  const [amount, setAmount] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')

  const submit = (e) => {
    e?.preventDefault()
    const val = parseMoneyInput(amount)
    if (val == null || val <= 0 || fromAccount === toAccount) return

    const autoDesc = `${ACCOUNT_MAP[fromAccount]?.name} to ${ACCOUNT_MAP[toAccount]?.name}`
    onAdd({
      date: new Date().toISOString().slice(0, 10),
      description: note.trim() || autoDesc,
      amount: val,
      type: 'transfer',
      category: 'transfer',
      account: fromAccount,
      fromAccount,
      toAccount,
    })
    setAmount('')
    setNote('')
    setShowNote(false)
    onDone?.()
  }

  const applyPreset = (preset) => {
    setFromAccount(preset.from)
    setToAccount(preset.to)
  }

  return (
    <div className="space-y-3">
      <div className="glass rounded-2xl p-3 md:p-4 space-y-3">
        <div className="flex items-center gap-2">
          <RemixIcon name="ri-arrow-left-right-line" className="text-lg text-transfer" />
          <h2 className="text-sm font-semibold">Transfer</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className={`rounded-full border px-3 py-1.5 text-[11px] transition ${
                fromAccount === p.from && toAccount === p.to
                  ? 'glass-active border-transfer/40 text-transfer'
                  : 'glass-subtle border-white/10 text-muted'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wide text-muted">From</p>
          <AccountChipPicker
            accounts={ACCOUNTS}
            value={fromAccount}
            exclude={toAccount}
            onChange={setFromAccount}
          />
        </div>

        <div className="flex justify-center">
          <RemixIcon name="ri-arrow-down-line" className="text-muted" />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wide text-muted">To</p>
          <AccountChipPicker
            accounts={ACCOUNTS}
            value={toAccount}
            exclude={fromAccount}
            onChange={setToAccount}
          />
        </div>

        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          required
          placeholder="Amount MAD"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="glass-input w-full rounded-xl px-3 py-3 text-lg font-semibold tabular-nums outline-none"
        />

        {!showNote ? (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="text-[11px] text-transfer hover:underline"
          >
            Add note (optional)
          </button>
        ) : (
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
            className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none"
          />
        )}

        <button
          type="button"
          onClick={submit}
          disabled={fromAccount === toAccount}
          className="w-full rounded-xl bg-transfer py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          Transfer
        </button>
      </div>
    </div>
  )
}
