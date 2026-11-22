import { useMemo } from 'react'
import RemixIcon from './icons/RemixIcon'
import { useCategoriesContext } from '../context/CategoriesContext'
import { ACCOUNT_MAP, formatMAD } from '../utils/constants'

function formatShortDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

export default function Dashboard({
  monthSummary,
  salaryCycle,
  balances,
  netWorth,
  expenseBreakdown,
  goalsSummary,
  activeAccount,
}) {
  const { getMeta } = useCategoriesContext()

  const accountLabel =
    activeAccount === 'all' ? 'All accounts' : ACCOUNT_MAP[activeAccount]?.name ?? activeAccount

  const cards = [
    {
      label: 'Income',
      value: monthSummary.income,
      icon: 'ri-arrow-up-circle-line',
      color: 'text-income',
      glass: 'glass-income',
    },
    {
      label: 'Expenses',
      value: monthSummary.expenses,
      icon: 'ri-arrow-down-circle-line',
      color: 'text-expense',
      glass: 'glass-expense',
    },
    {
      label: 'Net',
      value: monthSummary.net,
      icon: 'ri-piggy-bank-line',
      color: monthSummary.net >= 0 ? 'text-income' : 'text-expense',
      glass: monthSummary.net >= 0 ? 'glass-income' : 'glass-expense',
    },
  ]

  const visibleBalances = useMemo(() => {
    if (activeAccount === 'all') return balances
    return { [activeAccount]: balances[activeAccount] ?? 0 }
  }, [balances, activeAccount])

  return (
    <div className="space-y-2.5 md:space-y-4">
      <p className="text-[11px] text-muted">
        Viewing <span className="text-white/80">{accountLabel}</span>
      </p>

      <div className="grid grid-cols-3 gap-1.5 md:gap-3">
        {cards.map(({ label, value, icon, color, glass }) => (
          <div key={label} className={`glass ${glass} rounded-2xl p-2.5 md:p-4`}>
            <div className="flex items-center justify-between gap-1">
              <p className="text-[9px] uppercase tracking-wide text-muted md:text-xs">{label}</p>
              <RemixIcon name={icon} className={`text-sm md:text-base ${color}`} />
            </div>
            <p className={`mt-1 text-sm font-bold tabular-nums md:mt-2 md:text-2xl ${color}`}>
              {formatMAD(value)}
            </p>
          </div>
        ))}
      </div>

      {salaryCycle && (
        <div className="glass rounded-2xl p-3 md:p-4">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-1">
            <h3 className="text-sm font-semibold">This paycheck</h3>
            <p className="text-[10px] text-muted md:text-[11px]">
              {formatShortDate(salaryCycle.lastSalaryDate)} · {formatMAD(salaryCycle.lastSalaryAmount)} received
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="glass-expense rounded-xl p-3 md:p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted">Spent from it</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-expense md:text-2xl">
                {formatMAD(salaryCycle.spent)}
              </p>
              <p className="mt-1 text-[10px] leading-snug text-muted">
                Every expense since payday — including after you moved money Savings → Main.
              </p>
            </div>
            <div className="glass-income rounded-xl p-3 md:p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted">Still from paycheck</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-income md:text-2xl">
                {formatMAD(salaryCycle.keptFromSalary)}
              </p>
              <p className="mt-1 text-[10px] leading-snug text-muted">
                Salary minus spent (Main + Savings together).
              </p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs md:grid-cols-3 md:gap-3">
            <div className="glass-subtle rounded-xl px-2.5 py-2">
              <span className="text-muted">Main → Savings</span>
              <p className="font-semibold tabular-nums text-transfer">{formatMAD(salaryCycle.toSavings)}</p>
            </div>
            <div className="glass-subtle rounded-xl px-2.5 py-2">
              <span className="text-muted">
                Savings → Main
                {salaryCycle.fromSavingsCount > 0
                  ? ` · ${salaryCycle.fromSavingsCount}×`
                  : ''}
              </span>
              <p className="font-semibold tabular-nums">{formatMAD(salaryCycle.fromSavings)}</p>
            </div>
            <div className="glass-subtle col-span-2 rounded-xl px-2.5 py-2 md:col-span-1">
              <span className="text-muted">Net to Savings</span>
              <p className="font-semibold tabular-nums text-transfer">
                {formatMAD(salaryCycle.netToSavings)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-muted">
            Day {salaryCycle.daysInPeriod} · next salary ~{formatShortDate(salaryCycle.nextSalaryDate)} ·{' '}
            ~{formatMAD(salaryCycle.spendRate)}/day
          </p>
        </div>
      )}

      {goalsSummary}

      <div className="glass rounded-2xl p-3 md:p-4">
        <h3 className="text-sm font-semibold">Balances</h3>
        <div className="mt-2 space-y-1.5 md:mt-3 md:space-y-2">
          {Object.entries(visibleBalances).map(([id, amount]) => (
            <div key={id} className="flex items-center justify-between text-xs md:text-sm">
              <span className="text-muted">{ACCOUNT_MAP[id]?.name ?? id}</span>
              <span className={amount >= 0 ? 'font-medium text-income' : 'font-medium text-expense'}>
                {formatMAD(amount)}
              </span>
            </div>
          ))}
          {activeAccount === 'all' && (
            <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-sm font-semibold md:pt-2">
              <span>Net Worth</span>
              <span className="text-income">{formatMAD(netWorth)}</span>
            </div>
          )}
        </div>
      </div>

      {expenseBreakdown.length > 0 && (
        <div className="glass rounded-2xl p-3 md:p-4">
          <h3 className="mb-2 text-sm font-semibold md:mb-3">Top Categories</h3>
          <div className="space-y-2 md:space-y-3">
            {expenseBreakdown.slice(0, 5).map(({ categoryId, total, pct }) => (
              <div key={categoryId}>
                <div className="mb-1 flex justify-between text-xs md:text-sm">
                  <span className="truncate pr-2">{getMeta(categoryId).label}</span>
                  <span className="shrink-0 text-muted tabular-nums">{formatMAD(total)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10 md:h-2">
                  <div
                    className="h-full rounded-full bg-expense/70 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
