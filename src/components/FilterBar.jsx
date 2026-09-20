import { Search, X } from 'lucide-react'
import { CATEGORIES, TRANSACTION_TYPES } from '../utils/constants'

export default function FilterBar({ filters, onChange, onClear }) {
  const set = (key, value) => onChange({ ...filters, [key]: value })

  const hasFilters =
    filters.search || filters.category || filters.type || filters.dateFrom || filters.dateTo

  return (
    <div className="rounded-2xl border border-border bg-card p-3 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder="Search description or category…"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          className="w-full rounded-xl border border-border bg-charcoal py-2.5 pl-10 pr-10 text-sm outline-none focus:border-white/20"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => set('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select
          value={filters.category}
          onChange={(e) => set('category', e.target.value)}
          className="rounded-xl border border-border bg-charcoal px-3 py-2 text-sm outline-none focus:border-white/20"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>

        <select
          value={filters.type}
          onChange={(e) => set('type', e.target.value)}
          className="rounded-xl border border-border bg-charcoal px-3 py-2 text-sm outline-none focus:border-white/20"
        >
          <option value="">All types</option>
          {TRANSACTION_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => set('dateFrom', e.target.value)}
          className="rounded-xl border border-border bg-charcoal px-3 py-2 text-sm outline-none focus:border-white/20"
          placeholder="From"
        />

        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => set('dateTo', e.target.value)}
          className="rounded-xl border border-border bg-charcoal px-3 py-2 text-sm outline-none focus:border-white/20"
          placeholder="To"
        />
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-transfer hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
