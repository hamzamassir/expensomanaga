import RemixIcon from './icons/RemixIcon'
import { ACCOUNTS } from '../utils/constants'
import { AccountChipPicker } from './CategoryPicker'
import CategoryManager from './CategoryManager'

export default function SettingsPanel({ open, onClose, settings, setSettings, onConfirm }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close settings" />
      <aside className="glass-strong relative h-full w-full max-w-sm overflow-y-auto border-l border-white/10 p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RemixIcon name="ri-settings-3-line" className="text-lg text-transfer" />
            <h2 className="text-base font-semibold">Settings</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:text-white">
            <RemixIcon name="ri-close-line" />
          </button>
        </div>

        <section className="glass rounded-2xl p-3 space-y-2 mb-4">
          <p className="text-xs font-medium text-muted">Default expense account</p>
          <p className="text-[11px] text-muted leading-snug">
            Quick expenses and new spending withdraw from this account.
          </p>
          <AccountChipPicker
            accounts={ACCOUNTS}
            value={settings.defaultExpenseAccount}
            onChange={(id) => setSettings({ defaultExpenseAccount: id })}
          />
        </section>

        <CategoryManager onConfirm={onConfirm} />
      </aside>
    </div>
  )
}
