import { TrendingDown, TrendingUp, PiggyBank } from 'lucide-react'
import { formatMAD } from '../utils/constants'

export default function Dashboard({ monthSummary, balances, netWorth, expenseBreakdown }) {
  const cards = [
    {
      label: 'Total Income',
      value: monthSummary.income,
      icon: TrendingUp,
      color: 'text-income',
      bg: 'bg-income/10',
    },
    {
      label: 'Total Expenses',
      value: monthSummary.expenses,
      icon: TrendingDown,
      color: 'text-expense',
      bg: 'bg-expense/10',
    },
    {
      label: 'Net Savings',
      value: monthSummary.net,
      icon: PiggyBank,
      color: monthSummary.net >= 0 ? 'text-income' : 'text-expense',
      bg: monthSummary.net >= 0 ? 'bg-income/10' : 'bg-expense/10',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-2xl border border-border ${bg} p-4`}>
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`mt-2 text-2xl font-bold ${color}`}>{formatMAD(value)}</p>
            <p className="mt-1 text-xs text-muted">This month</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">Account Balances</h3>
        <div className="mt-3 space-y-2">
          {Object.entries(balances).map(([id, amount]) => (
            <div key={id} className="flex items-center justify-between text-sm">
              <span className="capitalize text-muted">{id.replace('_', ' ')}</span>
              <span className={amount >= 0 ? 'text-income font-medium' : 'text-expense font-medium'}>
                {formatMAD(amount)}
              </span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex items-center justify-between font-semibold">
            <span>Net Worth</span>
            <span className="text-income">{formatMAD(netWorth)}</span>
          </div>
        </div>
      </div>

      {expenseBreakdown.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Top Spending Categories</h3>
          <div className="space-y-3">
            {expenseBreakdown.slice(0, 5).map(({ category, total, pct, emoji }) => (
              <div key={category}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>
                    {emoji} {category}
                  </span>
                  <span className="text-muted">{formatMAD(total)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-border">
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
