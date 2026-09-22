import { useCallback, useEffect, useState } from 'react'
import * as api from '../utils/api'

export const SETTINGS_DEFAULTS = {
  defaultExpenseAccount: 'main',
}

export function useSettings() {
  const [settings, setSettingsState] = useState(SETTINGS_DEFAULTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api.getSettings()
        if (!cancelled) setSettingsState({ ...SETTINGS_DEFAULTS, ...data })
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setSettings = useCallback(async (patch) => {
    const next = await api.saveSettings(patch)
    setSettingsState((prev) => ({ ...prev, ...next }))
  }, [])

  return { settings, setSettings, loading }
}
