import { useMemo, useState } from 'react'
import { useCategoriesContext } from '../context/CategoriesContext'
import CategoryIcon from './icons/CategoryIcon'
import RemixIcon from './icons/RemixIcon'

export function CategoryPicker({ categories, topCategories, value, onChange, limit = 7 }) {
  const { allCategories } = useCategoriesContext()
  const [showAll, setShowAll] = useState(false)

  const top = useMemo(() => {
    if (topCategories?.length) return topCategories.slice(0, limit)
    const pool = categories ?? allCategories.filter((c) => c.type === 'expense')
    return pool.slice(0, limit)
  }, [topCategories, allCategories, limit, categories])

  const rest = useMemo(() => {
    const topIds = new Set(top.map((c) => c.id))
    const pool = categories ?? allCategories.filter((c) => c.type === 'expense')
    return pool.filter((c) => !topIds.has(c.id))
  }, [top, categories, allCategories])

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {top.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition active:scale-95 ${
              value === cat.id ? 'glass-active border-income/40' : 'glass-subtle border-white/10 hover:glass-active'
            }`}
          >
            <CategoryIcon categoryId={cat.id} size={22} weight="fill" className="text-white/90" />
            <span className="w-full truncate text-center text-[9px] leading-tight">{cat.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2 transition ${
            showAll ? 'glass-active' : 'glass-subtle border-dashed border-white/20'
          }`}
        >
          <RemixIcon name={showAll ? 'ri-close-line' : 'ri-add-line'} className="text-lg text-transfer" />
          <span className="text-[9px]">{showAll ? 'Less' : 'More'}</span>
        </button>
      </div>

      {showAll && rest.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {rest.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                onChange(cat.id)
                setShowAll(false)
              }}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition ${
                value === cat.id ? 'glass-active' : 'glass-subtle border-white/10'
              }`}
            >
              <CategoryIcon categoryId={cat.id} size={20} weight="fill" />
              <span className="w-full truncate text-center text-[9px]">{cat.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AccountChipPicker({ value, onChange, accounts, exclude }) {
  const list = accounts.filter((a) => a.id !== exclude)
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((acc) => (
        <button
          key={acc.id}
          type="button"
          onClick={() => onChange(acc.id)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
            value === acc.id ? 'glass-active border-income/40' : 'glass-subtle border-white/10'
          }`}
        >
          <RemixIcon name={acc.remix} className="text-base" />
          {acc.name}
        </button>
      ))}
    </div>
  )
}

export function TypeChipPicker({ value, onChange, types }) {
  return (
    <div className="flex flex-wrap gap-2">
      {types.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
            value === t.id ? 'glass-active border-income/40' : 'glass-subtle border-white/10'
          }`}
        >
          <RemixIcon name={t.icon} className={value === t.id ? t.color : 'text-muted'} />
          {t.label}
        </button>
      ))}
    </div>
  )
}
