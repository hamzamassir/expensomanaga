import { TrendingDown, TrendingUp, PiggyBank } from 'lucide-react'
import { formatMAD } from '../utils/constants'

export default function Dashboard({ monthSummary, balances, netWorth, expenseBreakdown }) {
  const cards = [
    {
      label: 'Income',
      value: monthSummary.income,
      icon: TrendingUp,
      color: 'text-income',
      glass: 'glass-income',
    },
    {
      label: 'Expenses',
      value: monthSummary.expenses,
      icon: TrendingDown,
      color: 'text-expense',
      glass: 'glass-expense',
    },
    {
      label: 'Net',
      value: monthSummary.net,
      icon: PiggyBank,
      color: monthSummary.net >= 0 ? 'text-income' : 'text-expense',
      glass: monthSummary.net >= 0 ? 'glass-income' : 'glass-expense',
    },
  ]

  return (
    <div className="space-y-2.5 md:space-y-4">
      <div className="grid grid-cols-3 gap-1.5 md:gap-3">
        {cards.map(({ label, value, icon: Icon, color, glass }) => (
          <div key={label} className={`glass ${glass} rounded-2xl p-2.5 md:p-4`}>
            <div className="flex items-center justify-between gap-1">
              <p className="text-[9px] uppercase tracking-wide text-muted md:text-xs">{label}</p>
              <Icon className={`h-3.5 w-3.5 shrink-0 md:h-4 md:w-4 ${color}`} />
            </div>
            <p className={`mt-1 text-sm font-bold tabular-nums md:mt-2 md:text-2xl ${color}`}>
              {formatMAD(value)}
            </p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-3 md:p-4">
        <h3 className="text-sm font-semibold">Balances</h3>
        <div className="mt-2 space-y-1.5 md:mt-3 md:space-y-2">
          {Object.entries(balances).map(([id, amount]) => (
            <div key={id} className="flex items-center justify-between text-xs md:text-sm">
              <span className="capitalize text-muted">{id}</span>
              <span className={amount >= 0 ? 'font-medium text-income' : 'font-medium text-expense'}>
                {formatMAD(amount)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-sm font-semibold md:pt-2">
            <span>Net Worth</span>
            <span className="text-income">{formatMAD(netWorth)}</span>
          </div>
        </div>
      </div>

      {expenseBreakdown.length > 0 && (
        <div className="glass rounded-2xl p-3 md:p-4">
          <h3 className="mb-2 text-sm font-semibold md:mb-3">Top Categories</h3>
          <div className="space-y-2 md:space-y-3">
            {expenseBreakdown.slice(0, 5).map(({ category, total, pct, emoji }) => (
              <div key={category}>
                <div className="mb-1 flex justify-between text-xs md:text-sm">
                  <span className="truncate pr-2">
                    {emoji} {category}
                  </span>
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
