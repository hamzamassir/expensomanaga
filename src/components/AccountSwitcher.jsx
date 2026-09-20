import { ACCOUNTS, ACCOUNT_MAP, formatMAD } from '../utils/constants'

export default function AccountSwitcher({ balances, netWorth, activeAccount, onChange }) {
  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-wider text-muted">Net Worth</p>
        <p className="mt-1 text-3xl font-bold text-income">{formatMAD(netWorth)}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onChange('all')}
          className={`rounded-xl border px-3 py-3 text-left transition ${
            activeAccount === 'all'
              ? 'border-white/20 bg-white/5'
              : 'border-border bg-card hover:border-white/10'
          }`}
        >
          <span className="text-lg">📊</span>
          <p className="mt-1 text-sm font-medium">All Accounts</p>
          <p className="text-xs text-muted">Combined view</p>
        </button>

        {ACCOUNTS.map((acc) => (
          <button
            key={acc.id}
            type="button"
            onClick={() => onChange(acc.id)}
            className={`rounded-xl border px-3 py-3 text-left transition ${
              activeAccount === acc.id
                ? 'border-white/20 bg-white/5'
                : 'border-border bg-card hover:border-white/10'
            }`}
          >
            <span className="text-lg">{acc.icon}</span>
            <p className="mt-1 text-sm font-medium">{acc.name}</p>
            <p
              className={`text-sm font-semibold ${
                balances[acc.id] >= 0 ? 'text-income' : 'text-expense'
              }`}
            >
              {formatMAD(balances[acc.id] ?? 0)}
            </p>
          </button>
        ))}
      </div>

      {activeAccount !== 'all' && (
        <p className="text-xs text-muted">
          Showing transactions for {ACCOUNT_MAP[activeAccount]?.name}
        </p>
      )}
    </section>
  )
}
