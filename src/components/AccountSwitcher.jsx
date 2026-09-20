import { ACCOUNTS, ACCOUNT_MAP, formatMAD } from '../utils/constants'

export default function AccountSwitcher({ balances, netWorth, activeAccount, onChange }) {
  return (
    <section className="space-y-2 md:space-y-3">
      <div className="glass rounded-2xl p-3 md:p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted md:text-xs">Net Worth</p>
        <p className="mt-0.5 text-2xl font-bold text-income md:mt-1 md:text-3xl">{formatMAD(netWorth)}</p>
      </div>

      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1 md:gap-2 lg:grid-cols-1">
        <button
          type="button"
          onClick={() => onChange('all')}
          className={`rounded-xl border px-2.5 py-2 text-left transition md:px-3 md:py-3 ${
            activeAccount === 'all' ? 'glass-active' : 'glass-subtle hover:glass-active'
          }`}
        >
          <span className="text-base md:text-lg">📊</span>
          <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">All</p>
          <p className="text-[10px] text-muted md:text-xs">Combined</p>
        </button>

        {ACCOUNTS.map((acc) => (
          <button
            key={acc.id}
            type="button"
            onClick={() => onChange(acc.id)}
            className={`rounded-xl border px-2.5 py-2 text-left transition md:px-3 md:py-3 ${
              activeAccount === acc.id ? 'glass-active' : 'glass-subtle hover:glass-active'
            }`}
          >
            <span className="text-base md:text-lg">{acc.icon}</span>
            <p className="mt-0.5 truncate text-xs font-medium md:mt-1 md:text-sm">{acc.name}</p>
            <p
              className={`text-xs font-semibold tabular-nums md:text-sm ${
                balances[acc.id] >= 0 ? 'text-income' : 'text-expense'
              }`}
            >
              {formatMAD(balances[acc.id] ?? 0)}
            </p>
          </button>
        ))}
      </div>

      {activeAccount !== 'all' && (
        <p className="hidden text-xs text-muted md:block">
          Filter: {ACCOUNT_MAP[activeAccount]?.name}
        </p>
      )}
    </section>
  )
}
