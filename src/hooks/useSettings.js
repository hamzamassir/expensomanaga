import { useCallback, useState } from 'react'

const SETTINGS_KEY = 'expensomanaga_settings'

export const SETTINGS_DEFAULTS = {
  defaultExpenseAccount: 'main',
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...SETTINGS_DEFAULTS, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { ...SETTINGS_DEFAULTS }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function useSettings() {
  const [settings, setSettingsState] = useState(() => loadSettings())

  const setSettings = useCallback((patch) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  return { settings, setSettings }
}
