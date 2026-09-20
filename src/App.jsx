import { useMemo, useState } from 'react'
import RemixIcon from './components/icons/RemixIcon'
import { useTransactions } from './hooks/useTransactions'
import { useGoals } from './hooks/useGoals'
import AccountSwitcher from './components/AccountSwitcher'
import Dashboard from './components/Dashboard'
import TransactionForm from './components/TransactionForm'
import TransactionList from './components/TransactionList'
import FilterBar from './components/FilterBar'
import { MobileBottomNav, DesktopNav } from './components/BottomNav'
import FinancialGoals, { GoalsSummary } from './components/FinancialGoals'
import InstallPrompt from './components/InstallPrompt'
import { ExpenseDonut, CashFlowBar, NetTrendLine } from './components/Charts'
import { currentMonthKey, getCategoryMeta } from './utils/constants'
import { downloadCsv, parseCsv, expenseByCategory, cashFlowByDay } from './utils/storage'

const defaultFilters = {
  search: '',
  category: '',
  type: '',
  account: '',
  dateFrom: '',
  dateTo: '',
}

export default function App() {
  const {
    transactions,
    activeAccount,
    setActiveAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    balances,
    netWorth,
    monthSummary,
    filter,
  } = useTransactions()

  const { goals, addGoal, updateGoal, deleteGoal } = useGoals()

  const [tab, setTab] = useState('home')
  const [filters, setFilters] = useState(defaultFilters)
  const [csvPaste, setCsvPaste] = useState('')
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const accountFilters = useMemo(
    () => ({
      ...filters,
      account: activeAccount === 'all' ? filters.account : activeAccount,
    }),
    [filters, activeAccount],
  )

  const filtered = useMemo(() => filter(accountFilters), [filter, accountFilters])

  const month = currentMonthKey()
  const breakdown = useMemo(() => {
    const raw = expenseByCategory(transactions, month)
    const total = raw.reduce((s, r) => s + r.total, 0) || 1
    return raw.map((r) => ({
      ...r,
      pct: (r.total / total) * 100,
      categoryId: r.category,
      category: getCategoryMeta(r.category).label,
    }))
  }, [transactions, month])

  const expenseChartData = useMemo(
    () => expenseByCategory(transactions, month),
    [transactions, month],
  )
  const cashFlowData = useMemo(() => cashFlowByDay(transactions, month), [transactions, month])

  const goalsSummary = useMemo(
    () =>
      goals.length ? (
        <GoalsSummary
          goals={goals}
          balances={balances}
          netWorth={netWorth}
          monthSummary={monthSummary}
        />
      ) : null,
    [goals, balances, netWorth, monthSummary],
  )

  const handleQuickAdd = (preset) => {
    addTransaction({
      date: new Date().toISOString().slice(0, 10),
      description: preset.description,
      amount: preset.amount,
      type: 'expense',
      category: preset.category,
      account: activeAccount === 'all' || activeAccount === 'cash' ? 'main' : activeAccount,
    })
    showToast(`${preset.label} logged`)
  }

  const handleCsvImport = (text, mode) => {
    try {
      const parsed = parseCsv(text)
      if (!parsed.length) {
        showToast('No valid rows found in CSV')
        return
      }
      importTransactions(parsed, mode)
      showToast(`Imported ${parsed.length} transactions`)
      setCsvPaste('')
    } catch {
      showToast('Failed to parse CSV')
    }
  }

  const resetData = () => {
    if (!confirm('Reset all data and reload seed transactions?')) return
    localStorage.removeItem('expensomanaga_transactions')
    localStorage.removeItem('expensomanaga_initialized')
    localStorage.removeItem('expensomanaga_mig_interest_savings')
    localStorage.removeItem('expensomanaga_goals')
    window.location.reload()
  }

  return (
    <div className="app-bg min-h-dvh text-white">
      <header className="sticky top-0 z-40 glass-strong border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 md:px-4 md:py-3">
          <div className="glass rounded-xl p-1.5 md:p-2">
            <RemixIcon name="ri-wallet-3-line" className="text-base text-income md:text-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold tracking-tight md:text-lg">Expensomanaga</h1>
            <p className="hidden text-[11px] text-muted md:block">Personal finance · local only</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-2 pb-[calc(3.25rem+env(safe-area-inset-bottom))] md:grid md:grid-cols-[240px_1fr] md:gap-5 md:px-4 md:py-4 md:pb-6 lg:grid-cols-[260px_1fr]">
        <aside className="mb-2 space-y-2 md:sticky md:top-[3.25rem] md:mb-0 md:self-start md:space-y-3">
          <AccountSwitcher
            balances={balances}
            netWorth={netWorth}
            activeAccount={activeAccount}
            onChange={setActiveAccount}
          />
          <DesktopNav active={tab} onChange={setTab} />
        </aside>

        <div className="min-w-0 space-y-2.5 md:space-y-4">
          {tab === 'home' && (
            <>
              <Dashboard
                monthSummary={monthSummary}
                balances={balances}
                netWorth={netWorth}
                expenseBreakdown={breakdown}
                goalsSummary={goalsSummary}
              />
              <TransactionForm onAdd={addTransaction} onQuickAdd={handleQuickAdd} />
              <InstallPrompt />
            </>
          )}

          {tab === 'transactions' && (
            <>
              <TransactionForm onAdd={addTransaction} onQuickAdd={handleQuickAdd} />
              <FilterBar
                filters={filters}
                onChange={setFilters}
                onClear={() => setFilters(defaultFilters)}
              />
              <p className="text-[11px] text-muted">{filtered.length} transactions</p>
              <TransactionList
                transactions={filtered}
                onUpdate={updateTransaction}
                onDelete={deleteTransaction}
              />
            </>
          )}

          {tab === 'analytics' && (
            <div className="grid gap-2.5 md:gap-4 lg:grid-cols-2">
              <section className="glass rounded-2xl p-3 md:p-4">
                <h2 className="mb-2 text-sm font-semibold md:mb-3">Expense Breakdown</h2>
                <ExpenseDonut data={expenseChartData} />
              </section>
              <section className="glass rounded-2xl p-3 md:p-4">
                <h2 className="mb-2 text-sm font-semibold md:mb-3">Daily Cash Flow</h2>
                <CashFlowBar data={cashFlowData} />
              </section>
              <section className="glass rounded-2xl p-3 md:p-4 lg:col-span-2">
                <h2 className="mb-2 text-sm font-semibold md:mb-3">Cumulative Net Trend</h2>
                <NetTrendLine data={cashFlowData} />
              </section>
            </div>
          )}

          {tab === 'goals' && (
            <FinancialGoals
              goals={goals}
              balances={balances}
              netWorth={netWorth}
              monthSummary={monthSummary}
              onAdd={addGoal}
              onDelete={deleteGoal}
              onUpdate={updateGoal}
            />
          )}

          {tab === 'data' && (
            <div className="space-y-2.5 md:space-y-4">
              <section className="glass rounded-2xl p-3 space-y-2 md:p-4 md:space-y-3">
                <h2 className="text-sm font-semibold">Export</h2>
                <p className="text-xs text-muted">{transactions.length} transactions</p>
                <button
                  type="button"
                  onClick={() => {
                    downloadCsv(transactions)
                    showToast('CSV downloaded')
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-income py-2.5 text-sm font-semibold text-black shadow-lg shadow-income/20 hover:bg-income/90 md:w-auto md:px-4"
                >
                  <RemixIcon name="ri-download-2-line" />
                  Export CSV
                </button>
              </section>

              <section className="glass rounded-2xl p-3 space-y-2 md:p-4 md:space-y-3">
                <h2 className="text-sm font-semibold">Import</h2>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-4 text-sm text-muted transition hover:border-income/40 hover:text-white md:py-6">
                  <RemixIcon name="ri-upload-2-line" />
                  Choose CSV file
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (ev) => handleCsvImport(ev.target.result, 'merge')
                      reader.readAsText(file)
                    }}
                  />
                </label>
                <textarea
                  value={csvPaste}
                  onChange={(e) => setCsvPaste(e.target.value)}
                  placeholder="Paste CSV…"
                  rows={4}
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-white/30"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCsvImport(csvPaste, 'merge')}
                    className="glass-subtle flex-1 rounded-xl py-2 text-sm hover:glass-active"
                  >
                    Merge
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCsvImport(csvPaste, 'replace')}
                    className="glass-expense flex-1 rounded-xl py-2 text-sm text-expense"
                  >
                    Replace
                  </button>
                </div>
              </section>

              <section className="glass glass-expense rounded-2xl p-3 space-y-2 md:p-4 md:space-y-3">
                <h2 className="text-sm font-semibold text-expense">Reset</h2>
                <button
                  type="button"
                  onClick={resetData}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-expense/30 py-2 text-sm text-expense md:w-auto md:px-4"
                >
                  <RemixIcon name="ri-refresh-line" />
                  Reset seed data
                </button>
              </section>
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav active={tab} onChange={setTab} />

      {toast && (
        <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 glass rounded-full px-4 py-1.5 text-xs shadow-xl md:bottom-6 md:text-sm">
          {toast}
        </div>
      )}
    </div>
  )
}
