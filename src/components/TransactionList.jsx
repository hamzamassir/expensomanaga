import { useState } from 'react'
import { Pencil, Trash2, ArrowLeftRight } from 'lucide-react'
import {
  formatMAD,
  formatDate,
  getCategoryMeta,
  getTypeColor,
  getTypeBg,
  ACCOUNT_MAP,
} from '../utils/constants'

function AmountDisplay({ tx }) {
  const prefix =
    tx.type === 'income' || tx.type === 'previous_balance'
      ? '+'
      : tx.type === 'transfer'
        ? '↔'
        : '-'
  return (
    <span className={`font-semibold tabular-nums ${getTypeColor(tx.type)}`}>
      {prefix}
      {formatMAD(tx.amount)}
    </span>
  )
}

function EditRow({ tx, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...tx })

  return (
    <div className="rounded-xl border border-border bg-charcoal p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={draft.date}
          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
        />
        <input
          type="number"
          step="0.01"
          value={draft.amount}
          onChange={(e) => setDraft({ ...draft, amount: parseFloat(e.target.value) })}
          className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
        />
      </div>
      <input
        value={draft.description}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-sm"
      />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-border py-1.5 text-xs">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="flex-1 rounded-lg bg-income py-1.5 text-xs font-semibold text-black"
        >
          Update
        </button>
      </div>
    </div>
  )
}

export default function TransactionList({ transactions, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null)

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted">
        No transactions match your filters.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const cat = getCategoryMeta(tx.category)
        const isEditing = editingId === tx.id

        if (isEditing) {
          return (
            <EditRow
              key={tx.id}
              tx={tx}
              onCancel={() => setEditingId(null)}
              onSave={(updated) => {
                onUpdate(tx.id, updated)
                setEditingId(null)
              }}
            />
          )
        }

        return (
          <article
            key={tx.id}
            className={`flex items-start gap-3 rounded-2xl border p-3 ${getTypeBg(tx.type)}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-lg">
              {tx.type === 'transfer' ? <ArrowLeftRight className="h-4 w-4 text-transfer" /> : cat.emoji}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium leading-tight">{tx.description}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(tx.date)} · {cat.label}
                  </p>
                  {tx.type === 'transfer' && (
                    <p className="text-xs text-transfer">
                      {ACCOUNT_MAP[tx.fromAccount]?.name} → {ACCOUNT_MAP[tx.toAccount]?.name}
                    </p>
                  )}
                  {tx.type !== 'transfer' && (
                    <p className="text-xs text-muted capitalize">
                      {ACCOUNT_MAP[tx.account]?.name ?? tx.account}
                    </p>
                  )}
                </div>
                <AmountDisplay tx={tx} />
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                onClick={() => setEditingId(tx.id)}
                className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-white"
                aria-label="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this transaction?')) onDelete(tx.id)
                }}
                className="rounded-lg p-1.5 text-muted hover:bg-expense/10 hover:text-expense"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
