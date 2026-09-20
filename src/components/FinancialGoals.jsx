import { useMemo, useState } from 'react'
import RemixIcon from './icons/RemixIcon'
import CategoryIcon from './icons/CategoryIcon'
import { formatMAD } from '../utils/constants'
import { parseMoneyInput } from '../utils/money'
import { computeGoalProgress, GOAL_TRACKERS } from '../hooks/useGoals'

function GoalCard({ goal, progress, onDelete, onUpdateSaved, compact = false }) {
  const trackerLabel = GOAL_TRACKERS.find((t) => t.id === goal.track)?.label ?? goal.track

  return (
    <article className={`glass rounded-2xl ${compact ? 'p-3' : 'p-3 md:p-4'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{goal.name}</h3>
          <p className="text-[11px] text-muted">{trackerLabel}</p>
        </div>
        {!compact && (
          <button
            type="button"
            onClick={() => onDelete(goal.id)}
            className="rounded-lg p-1.5 text-muted hover:bg-expense/10 hover:text-expense"
            aria-label="Delete goal"
          >
            <RemixIcon name="ri-delete-bin-line" className="text-sm" />
          </button>
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <p className="text-lg font-bold tabular-nums text-income md:text-xl">
            {formatMAD(progress.current)}
          </p>
          <p className="text-[11px] text-muted">of {formatMAD(goal.target)}</p>
        </div>
        <span
          className={`text-sm font-semibold tabular-nums ${
            progress.complete ? 'text-income' : 'text-transfer'
          }`}
        >
          {progress.pct.toFixed(0)}%
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${
            progress.complete ? 'bg-income' : 'bg-transfer'
          }`}
          style={{ width: `${progress.pct}%` }}
        />
      </div>

      {!progress.complete && (
        <p className="mt-1.5 text-[11px] text-muted">
          {formatMAD(progress.remaining)} remaining
          {goal.deadline ? ` · due ${goal.deadline}` : ''}
        </p>
      )}

      {goal.track === 'manual' && !compact && (
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            defaultValue={goal.savedAmount ?? 0}
            onBlur={(e) => {
              const val = parseMoneyInput(e.target.value)
              if (val != null) onUpdateSaved(goal.id, val)
            }}
            className="glass-input flex-1 rounded-xl px-2 py-1.5 text-sm"
          />
          <span className="self-center text-xs text-muted">saved</span>
        </div>
      )}
    </article>
  )
}

export function GoalsSummary({ goals, balances, netWorth, monthSummary }) {
  const top = useMemo(() => {
    if (!goals.length) return null
    const withProgress = goals.map((g) => ({
      goal: g,
      progress: computeGoalProgress(g, { balances, netWorth, monthSummary }),
    }))
    return withProgress.sort((a, b) => b.progress.pct - a.progress.pct)[0]
  }, [goals, balances, netWorth, monthSummary])

  if (!top) return null

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <RemixIcon name="ri-flag-line" className="text-transfer" />
        <h3 className="text-sm font-semibold">Active Goal</h3>
      </div>
      <GoalCard goal={top.goal} progress={top.progress} compact />
    </section>
  )
}

export default function FinancialGoals({
  goals,
  balances,
  netWorth,
  monthSummary,
  onAdd,
  onDelete,
  onUpdate,
  onRequestDelete,
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    target: '',
    track: 'savings',
    deadline: '',
  })

  const enriched = useMemo(
    () =>
      goals.map((g) => ({
        goal: g,
        progress: computeGoalProgress(g, { balances, netWorth, monthSummary }),
      })),
    [goals, balances, netWorth, monthSummary],
  )

  const submit = (e) => {
    e.preventDefault()
    const target = parseMoneyInput(form.target)
    if (!form.name.trim() || target == null || target <= 0) return
    onAdd({
      name: form.name.trim(),
      target,
      track: form.track,
      deadline: form.deadline || null,
    })
    setForm({ name: '', target: '', track: 'savings', deadline: '' })
    setOpen(false)
  }

  return (
    <div className="space-y-2.5 md:space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RemixIcon name="ri-flag-2-line" className="text-xl text-transfer" />
          <h2 className="text-sm font-semibold md:text-base">Financial Goals</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="glass-subtle flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium hover:glass-active md:text-sm"
        >
          <RemixIcon name={open ? 'ri-close-line' : 'ri-add-line'} />
          {open ? 'Cancel' : 'New goal'}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="glass rounded-2xl p-3 space-y-2 md:p-4 md:space-y-3">
          <label className="block space-y-0.5">
            <span className="text-[10px] text-muted md:text-xs">Goal name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Emergency fund, vacation…"
              className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-0.5">
              <span className="text-[10px] text-muted md:text-xs">Target (MAD)</span>
              <input
                type="number"
                required
                min="1"
                step="1"
                inputMode="numeric"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="space-y-0.5">
              <span className="text-[10px] text-muted md:text-xs">Deadline</span>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none"
              />
            </label>
          </div>
          <label className="block space-y-0.5">
            <span className="text-[10px] text-muted md:text-xs">Track progress from</span>
            <select
              value={form.track}
              onChange={(e) => setForm({ ...form, track: e.target.value })}
              className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none"
            >
              {GOAL_TRACKERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="w-full rounded-xl bg-income py-2.5 text-sm font-semibold text-black shadow-lg shadow-income/20"
          >
            Create goal
          </button>
        </form>
      )}

      {enriched.length === 0 ? (
        <div className="glass-subtle rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-muted">
          <CategoryIcon categoryId="salary" size={32} className="mx-auto mb-2 text-muted" />
          Set a savings target to track your progress.
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 md:gap-3">
          {enriched.map(({ goal, progress }) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={progress}
              onDelete={(id) =>
                onRequestDelete({
                  title: 'Delete goal?',
                  message: `"${goal.name}" will be permanently removed.`,
                  danger: true,
                  confirmLabel: 'Delete',
                  onConfirm: () => onDelete(id),
                })
              }
              onUpdateSaved={(id, amount) => onUpdate(id, { savedAmount: amount })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
