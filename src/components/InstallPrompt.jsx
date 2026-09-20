import { useEffect, useState } from 'react'
import RemixIcon from './icons/RemixIcon'

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('expensomanaga_pwa_dismiss') === '1',
  )
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferred(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed || dismissed || !deferred) return null

  return (
    <div className="glass rounded-2xl p-3 md:p-4">
      <div className="flex items-start gap-3">
        <div className="glass-transfer rounded-xl p-2">
          <RemixIcon name="ri-download-cloud-2-line" className="text-lg text-transfer" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install app</p>
          <p className="mt-0.5 text-[11px] text-muted">
            Add Expensomanaga to your home screen for quick access offline.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={async () => {
                await deferred.prompt()
                setDeferred(null)
              }}
              className="rounded-xl bg-income px-3 py-1.5 text-xs font-semibold text-black"
            >
              Install
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('expensomanaga_pwa_dismiss', '1')
                setDismissed(true)
              }}
              className="glass-subtle rounded-xl px-3 py-1.5 text-xs text-muted"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
