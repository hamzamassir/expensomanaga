import { useState } from 'react'
import RemixIcon from './icons/RemixIcon'
import CategoryIcon from './icons/CategoryIcon'
import { useCategoriesContext } from '../context/CategoriesContext'
import {
  formatMAD,
  formatDate,
  getTypeColor,
  getTypeBg,
  amountPrefix,
  ACCOUNT_MAP,
} from '../utils/constants'
import { parseMoneyInput } from '../utils/money'

function AmountDisplay({ tx }) {
  const prefix = amountPrefix(tx.type)
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
    <div className="glass rounded-xl p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={draft.date}
          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          className="glass-input rounded-lg px-2 py-1.5 text-sm"
        />
        <input
          type="number"
          step="0.01"
          value={draft.amount}
          onChange={(e) => {
            const val = parseMoneyInput(e.target.value)
            if (val != null) setDraft({ ...draft, amount: val })
          }}
          className="glass-input rounded-lg px-2 py-1.5 text-sm"
        />
      </div>
      <input
        value={draft.description}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        className="glass-input w-full rounded-lg px-2 py-1.5 text-sm"
      />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="glass-subtle flex-1 rounded-lg py-1.5 text-xs">
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

export default function TransactionList({ transactions, onUpdate, onDelete, onRequestDelete }) {
  const { getMeta } = useCategoriesContext()
  const [editingId, setEditingId] = useState(null)

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 glass-subtle p-6 text-center text-sm text-muted md:p-8">
        No transactions match your filters.
      </div>
    )
  }

  return (
    <div className="space-y-1.5 md:space-y-2">
      {transactions.map((tx) => {
        const cat = getMeta(tx.category)
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
            className={`flex items-start gap-2.5 rounded-2xl p-2.5 md:gap-3 md:p-3 ${getTypeBg(tx.type)}`}
          >
            <div className="glass flex h-9 w-9 shrink-0 items-center justify-center rounded-xl md:h-10 md:w-10">
              <CategoryIcon
                categoryId={tx.type === 'transfer' ? 'transfer' : tx.category}
                size={18}
                className={getTypeColor(tx.type)}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium leading-tight">{tx.description}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(tx.date)} · {cat.label}
                  </p>
                  {tx.type === 'transfer' ? (
                    <p className="text-xs text-transfer">
                      {ACCOUNT_MAP[tx.fromAccount]?.name} → {ACCOUNT_MAP[tx.toAccount]?.name}
                    </p>
                  ) : (
                    <p className="text-xs text-muted">{ACCOUNT_MAP[tx.account]?.name ?? tx.account}</p>
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
                <RemixIcon name="ri-edit-line" className="text-sm" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onRequestDelete({
                    title: 'Delete transaction?',
                    message: `"${tx.description}" (${formatMAD(tx.amount)}) will be removed.`,
                    danger: true,
                    confirmLabel: 'Delete',
                    onConfirm: () => onDelete(tx.id),
                  })
                }
                className="rounded-lg p-1.5 text-muted hover:bg-expense/10 hover:text-expense"
                aria-label="Delete"
              >
                <RemixIcon name="ri-delete-bin-line" className="text-sm" />
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
