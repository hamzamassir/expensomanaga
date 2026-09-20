import { LayoutDashboard, List, BarChart3, Settings } from 'lucide-react'

const tabs = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
  { id: 'transactions', label: 'Txns', icon: List },
  { id: 'analytics', label: 'Charts', icon: BarChart3 },
  { id: 'data', label: 'Data', icon: Settings },
]

export function MobileBottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-white/10 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition active:scale-95 ${
              active === id ? 'text-income' : 'text-muted'
            }`}
          >
            <Icon className={`h-5 w-5 ${active === id ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}`} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}

export function DesktopNav({ active, onChange }) {
  return (
    <nav className="hidden md:flex flex-col gap-1 glass rounded-2xl p-1.5">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            active === id ? 'glass-active text-white' : 'text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </nav>
  )
}
