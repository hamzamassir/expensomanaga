import { useMemo, useState } from 'react'
import { Wallet, Download, Upload, RefreshCw } from 'lucide-react'
import { useTransactions } from './hooks/useTransactions'
import AccountSwitcher from './components/AccountSwitcher'
import Dashboard from './components/Dashboard'
import TransactionForm from './components/TransactionForm'
import TransactionList from './components/TransactionList'
import FilterBar from './components/FilterBar'
import BottomNav from './components/BottomNav'
import MockAIUpload from './components/MockAIUpload'
import { ExpenseDonut, CashFlowBar, NetTrendLine } from './components/Charts'
import {
  currentMonthKey,
  getCategoryMeta,
} from './utils/constants'
import {
  downloadCsv,
  parseCsv,
  expenseByCategory,
  cashFlowByDay,
  mockParseScreenshot,
} from './utils/storage'

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
      emoji: getCategoryMeta(r.category).emoji,
      category: getCategoryMeta(r.category).label,
    }))
  }, [transactions, month])

  const expenseChartData = useMemo(
    () => expenseByCategory(transactions, month),
    [transactions, month],
  )
  const cashFlowData = useMemo(() => cashFlowByDay(transactions, month), [transactions, month])

  const handleQuickAdd = (preset) => {
    addTransaction({
      date: new Date().toISOString().slice(0, 10),
      description: preset.description,
      amount: preset.amount,
      type: 'expense',
      category: preset.category,
      account: activeAccount === 'all' ? 'main' : activeAccount,
    })
    showToast(`${preset.emoji} ${preset.label} logged!`)
  }

  const handleMockAI = (file) => {
    const parsed = mockParseScreenshot(file)
    importTransactions(parsed, 'merge')
    showToast(`Demo: added ${parsed.length} transactions from screenshot`)
    setTab('transactions')
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
    window.location.reload()
  }

  return (
    <div className="min-h-dvh bg-charcoal text-white">
      <header className="sticky top-0 z-40 border-b border-border bg-charcoal/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-income/10 p-2">
              <Wallet className="h-5 w-5 text-income" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Expensomanaga</h1>
              <p className="text-[11px] text-muted">Personal finance · local only</p>
            </div>
          </div>
          <div className="hidden md:block">
            <BottomNav active={tab} onChange={setTab} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 pb-28 md:pb-8 md:grid md:grid-cols-[280px_1fr] md:gap-6">
        <aside className="mb-4 md:mb-0 md:sticky md:top-20 md:self-start space-y-4">
          <AccountSwitcher
            balances={balances}
            netWorth={netWorth}
            activeAccount={activeAccount}
            onChange={setActiveAccount}
          />
          <div className="hidden md:block">
            <BottomNav active={tab} onChange={setTab} />
          </div>
        </aside>

        <div className="space-y-4 min-w-0">
          {tab === 'home' && (
            <>
              <Dashboard
                monthSummary={monthSummary}
                balances={balances}
                netWorth={netWorth}
                expenseBreakdown={breakdown}
              />
              <TransactionForm onAdd={addTransaction} onQuickAdd={handleQuickAdd} />
              <MockAIUpload onParsed={handleMockAI} />
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
              <p className="text-xs text-muted">{filtered.length} transaction(s)</p>
              <TransactionList
                transactions={filtered}
                onUpdate={updateTransaction}
                onDelete={deleteTransaction}
              />
            </>
          )}

          {tab === 'analytics' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold">Expense Breakdown</h2>
                <ExpenseDonut data={expenseChartData} />
              </section>
              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold">Daily Cash Flow</h2>
                <CashFlowBar data={cashFlowData} />
              </section>
              <section className="rounded-2xl border border-border bg-card p-4 lg:col-span-2">
                <h2 className="mb-3 text-sm font-semibold">Cumulative Net Trend</h2>
                <NetTrendLine data={cashFlowData} />
              </section>
            </div>
          )}

          {tab === 'data' && (
            <div className="space-y-4">
              <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <h2 className="text-sm font-semibold">Export</h2>
                <p className="text-xs text-muted">
                  Download all {transactions.length} transactions as CSV.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    downloadCsv(transactions)
                    showToast('CSV downloaded')
                  }}
                  className="flex items-center gap-2 rounded-xl bg-income px-4 py-2.5 text-sm font-semibold text-black hover:bg-income/90"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              </section>

              <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <h2 className="text-sm font-semibold">Import</h2>
                <p className="text-xs text-muted">
                  Upload a CSV file or paste rows below. Format: Date, Description, Amount, Type
                </p>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border py-6 text-sm text-muted hover:border-income/40 hover:text-white">
                  <Upload className="h-4 w-4" />
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
                  placeholder="Or paste CSV content here…"
                  rows={5}
                  className="w-full rounded-xl border border-border bg-charcoal px-3 py-2 text-xs font-mono outline-none focus:border-white/20"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCsvImport(csvPaste, 'merge')}
                    className="flex-1 rounded-xl border border-border py-2 text-sm hover:bg-white/5"
                  >
                    Merge import
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCsvImport(csvPaste, 'replace')}
                    className="flex-1 rounded-xl border border-expense/30 bg-expense/10 py-2 text-sm text-expense hover:bg-expense/20"
                  >
                    Replace all
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <h2 className="text-sm font-semibold text-expense">Reset</h2>
                <p className="text-xs text-muted">
                  Clear localStorage and reload initial seed data from your CSV.
                </p>
                <button
                  type="button"
                  onClick={resetData}
                  className="flex items-center gap-2 rounded-xl border border-expense/30 px-4 py-2 text-sm text-expense hover:bg-expense/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset to seed data
                </button>
              </section>
            </div>
          )}
        </div>
      </main>

      <div className="md:hidden">
        <BottomNav active={tab} onChange={setTab} />
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-lg md:bottom-8">
          {toast}
        </div>
      )}
    </div>
  )
}
