import { useMemo, useState } from 'react'
import RemixIcon from './components/icons/RemixIcon'
import { useTransactions } from './hooks/useTransactions'
import { useGoals } from './hooks/useGoals'
import { useCategories } from './hooks/useCategories'
import { useSettings } from './hooks/useSettings'
import { CategoriesContext } from './context/CategoriesContext'
import AccountSwitcher from './components/AccountSwitcher'
import Dashboard from './components/Dashboard'
import QuickExpense from './components/QuickExpense'
import TransactionForm from './components/TransactionForm'
import TransferPanel from './components/TransferPanel'
import TransactionList from './components/TransactionList'
import FilterBar from './components/FilterBar'
import { MobileBottomNav, DesktopNav } from './components/BottomNav'
import FinancialGoals, { GoalsSummary } from './components/FinancialGoals'
import InstallPrompt from './components/InstallPrompt'
import SettingsPanel from './components/SettingsPanel'
import ConfirmDialog from './components/ConfirmDialog'
import {
  ExpenseDonut,
  TopCategoriesBar,
  MonthlyExpenseTrend,
  IncomeVsExpenseChart,
} from './components/Charts'
import { currentMonthKey, ACCOUNT_MAP } from './utils/constants'
import { expenseByCategory, monthlyExpenseTrend, downloadCsv, parseCsv } from './utils/storage'

const defaultFilters = {
  search: '',
  category: '',
  type: '',
  account: '',
  dateFrom: '',
  dateTo: '',
}

function AppContent() {
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
  const { settings, setSettings } = useSettings()

  const [tab, setTab] = useState('home')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [filters, setFilters] = useState(defaultFilters)
  const [csvPaste, setCsvPaste] = useState('')
  const [toast, setToast] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const requestConfirm = (opts) => {
    setConfirm({
      ...opts,
      onConfirm: () => {
        opts.onConfirm?.()
        setConfirm(null)
      },
      onCancel: () => setConfirm(null),
    })
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
  const accountLabel =
    activeAccount === 'all' ? 'All accounts' : ACCOUNT_MAP[activeAccount]?.name ?? activeAccount

  const breakdown = useMemo(() => {
    const raw = expenseByCategory(transactions, month, activeAccount)
    const total = raw.reduce((s, r) => s + r.total, 0) || 1
    return raw.map((r) => ({
      ...r,
      pct: (r.total / total) * 100,
      categoryId: r.category,
    }))
  }, [transactions, month, activeAccount])

  const expenseChartData = useMemo(
    () => expenseByCategory(transactions, month, activeAccount),
    [transactions, month, activeAccount],
  )

  const monthlyTrend = useMemo(
    () => monthlyExpenseTrend(transactions, 6, activeAccount),
    [transactions, activeAccount],
  )

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
    requestConfirm({
      title: 'Reset all data?',
      message: 'This clears transactions, goals, and custom categories, then reloads seed data.',
      danger: true,
      confirmLabel: 'Reset',
      onConfirm: () => {
        localStorage.removeItem('expensomanaga_transactions')
        localStorage.removeItem('expensomanaga_initialized')
        localStorage.removeItem('expensomanaga_mig_interest_savings')
        localStorage.removeItem('expensomanaga_mig_no_cash')
        localStorage.removeItem('expensomanaga_goals')
        localStorage.removeItem('expensomanaga_custom_categories')
        window.location.reload()
      },
    })
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
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="glass-subtle rounded-xl p-2 text-muted transition hover:glass-active hover:text-white"
            aria-label="Settings"
          >
            <RemixIcon name="ri-settings-3-line" className="text-lg" />
          </button>
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
                activeAccount={activeAccount}
              />
              <QuickExpense
                transactions={transactions}
                defaultAccount={settings.defaultExpenseAccount}
                onAdd={addTransaction}
                onDone={(label) => showToast(`${label} logged`)}
              />
              <InstallPrompt />
            </>
          )}

          {tab === 'transactions' && (
            <>
              <TransactionForm
                transactions={transactions}
                defaultExpenseAccount={settings.defaultExpenseAccount}
                onAdd={addTransaction}
                onDone={() => showToast('Saved')}
              />
              <FilterBar
                filters={filters}
                onChange={setFilters}
                onClear={() => setFilters(defaultFilters)}
              />
              <p className="text-[11px] text-muted">
                {filtered.length} transactions · {accountLabel}
              </p>
              <TransactionList
                transactions={filtered}
                onUpdate={updateTransaction}
                onDelete={deleteTransaction}
                onRequestDelete={requestConfirm}
              />
            </>
          )}

          {tab === 'transfers' && (
            <TransferPanel onAdd={addTransaction} onDone={() => showToast('Transfer saved')} />
          )}

          {tab === 'analytics' && (
            <div className="space-y-2.5 md:space-y-4">
              <p className="text-[11px] text-muted">
                Charts for <span className="text-white/80">{accountLabel}</span>
              </p>
              <div className="grid gap-2.5 md:gap-4 lg:grid-cols-2">
                <section className="glass rounded-2xl p-3 md:p-4">
                  <h2 className="mb-1 text-sm font-semibold">Where money goes</h2>
                  <ExpenseDonut data={expenseChartData} />
                </section>
                <section className="glass rounded-2xl p-3 md:p-4">
                  <h2 className="mb-1 text-sm font-semibold">Top spending</h2>
                  <TopCategoriesBar data={expenseChartData} />
                </section>
                <section className="glass rounded-2xl p-3 md:p-4">
                  <h2 className="mb-1 text-sm font-semibold">Income vs expenses</h2>
                  <IncomeVsExpenseChart summary={monthSummary} />
                </section>
                <section className="glass rounded-2xl p-3 md:p-4">
                  <h2 className="mb-1 text-sm font-semibold">Last 6 months</h2>
                  <MonthlyExpenseTrend data={monthlyTrend} />
                </section>
              </div>
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
              onRequestDelete={requestConfirm}
            />
          )}

          {tab === 'data' && (
            <div className="space-y-2.5 md:space-y-4">
              <section className="glass rounded-2xl p-3 space-y-2 md:p-4 md:space-y-3">
                <h2 className="text-sm font-semibold">Export</h2>
                <button
                  type="button"
                  onClick={() => {
                    downloadCsv(transactions)
                    showToast('CSV downloaded')
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-income py-2.5 text-sm font-semibold text-black md:w-auto md:px-4"
                >
                  <RemixIcon name="ri-download-2-line" />
                  Export CSV
                </button>
              </section>

              <section className="glass rounded-2xl p-3 space-y-2 md:p-4 md:space-y-3">
                <h2 className="text-sm font-semibold">Import</h2>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-4 text-sm text-muted hover:border-income/40">
                  <RemixIcon name="ri-upload-2-line" />
                  Choose CSV
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
                  className="glass-input w-full rounded-xl px-3 py-2 text-xs font-mono outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCsvImport(csvPaste, 'merge')}
                    className="glass-subtle flex-1 rounded-xl py-2 text-sm"
                  >
                    Merge
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      requestConfirm({
                        title: 'Replace all transactions?',
                        message: 'This deletes every transaction and imports the CSV instead.',
                        danger: true,
                        confirmLabel: 'Replace all',
                        onConfirm: () => handleCsvImport(csvPaste, 'replace'),
                      })
                    }
                    className="glass-expense flex-1 rounded-xl py-2 text-sm text-expense"
                  >
                    Replace
                  </button>
                </div>
              </section>

              <section className="glass glass-expense rounded-2xl p-3 md:p-4">
                <button
                  type="button"
                  onClick={resetData}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-expense/30 py-2 text-sm text-expense"
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

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
        onConfirm={requestConfirm}
      />

      {toast && (
        <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 glass rounded-full px-4 py-1.5 text-xs shadow-xl md:bottom-6 md:text-sm">
          {toast}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onConfirm={confirm?.onConfirm}
        onCancel={confirm?.onCancel}
      />
    </div>
  )
}

export default function App() {
  const categories = useCategories()
  return (
    <CategoriesContext.Provider value={categories}>
      <AppContent />
    </CategoriesContext.Provider>
  )
}
