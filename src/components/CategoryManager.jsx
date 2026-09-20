import { useState } from 'react'
import RemixIcon from './icons/RemixIcon'
import CategoryIcon, { PhosphorGlyph } from './icons/CategoryIcon'
import { PHOSPHOR_ICON_OPTIONS } from '../hooks/useCategories'
import { useCategoriesContext } from '../context/CategoriesContext'

export default function CategoryManager({ onConfirm }) {
  const { customCategories, addCategory, deleteCategory } = useCategoriesContext()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ label: '', type: 'expense', phosphor: 'Package' })

  const submit = (e) => {
    e.preventDefault()
    if (!form.label.trim()) return
    addCategory(form)
    setForm({ label: '', type: 'expense', phosphor: 'Package' })
    setOpen(false)
  }

  return (
    <section className="glass rounded-2xl p-3 space-y-2 md:p-4 md:space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <RemixIcon name="ri-price-tag-3-line" className="text-transfer" />
          <h2 className="text-sm font-semibold">Custom Categories</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="glass-subtle rounded-xl px-2.5 py-1.5 text-xs hover:glass-active"
        >
          {open ? 'Cancel' : 'Add category'}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="glass-subtle space-y-2 rounded-xl p-3">
          <input
            required
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Category name"
            className="glass-input w-full rounded-xl px-3 py-2 text-sm"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="glass-input w-full rounded-xl px-3 py-2 text-sm"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <p className="text-[10px] text-muted">Pick an icon</p>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
            {PHOSPHOR_ICON_OPTIONS.map(({ id }) => (
              <button
                key={id}
                type="button"
                onClick={() => setForm({ ...form, phosphor: id })}
                className={`flex aspect-square items-center justify-center rounded-lg border transition ${
                  form.phosphor === id ? 'glass-active border-income/40' : 'glass-subtle border-white/10'
                }`}
              >
                <PhosphorGlyph name={id} size={18} className="text-white/80" weight="fill" />
              </button>
            ))}
          </div>
          <button type="submit" className="w-full rounded-xl bg-income py-2 text-sm font-semibold text-black">
            Save category
          </button>
        </form>
      )}

      {customCategories.length === 0 ? (
        <p className="text-xs text-muted">No custom categories yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {customCategories.map((cat) => (
            <li
              key={cat.id}
              className="glass-subtle flex items-center justify-between gap-2 rounded-xl px-2.5 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <CategoryIcon categoryId={cat.id} size={18} weight="fill" />
                <span className="truncate text-sm">{cat.label}</span>
                <span className="text-[10px] capitalize text-muted">{cat.type}</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onConfirm({
                    title: 'Delete category?',
                    message: `"${cat.label}" will be removed. Existing transactions keep this tag.`,
                    danger: true,
                    confirmLabel: 'Delete',
                    onConfirm: () => deleteCategory(cat.id),
                  })
                }
                className="rounded-lg p-1.5 text-muted hover:text-expense"
                aria-label="Delete category"
              >
                <RemixIcon name="ri-delete-bin-line" className="text-sm" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
