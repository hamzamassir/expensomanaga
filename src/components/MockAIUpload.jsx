import { useRef, useState } from 'react'
import { Sparkles, Upload, Loader2 } from 'lucide-react'

export default function MockAIUpload({ onParsed }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)

  const processFile = async (file) => {
    if (!file) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    onParsed(file)
  }

  return (
    <div
      className={`rounded-2xl border-2 border-dashed p-3 transition md:p-4 ${
        dragging ? 'glass-transfer border-transfer/40' : 'glass-subtle border-white/15'
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        processFile(e.dataTransfer.files?.[0])
      }}
    >
      <div className="flex items-start gap-2.5 md:gap-3">
        <div className="glass-transfer rounded-xl p-1.5 md:p-2">
          <Sparkles className="h-4 w-4 text-transfer md:h-5 md:w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">AI Import (Demo)</h3>
          <p className="mt-0.5 text-[11px] leading-snug text-muted md:text-xs">
            Drop a banking screenshot — demo adds sample entries locally.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => processFile(e.target.files?.[0])}
      />

      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="glass-transfer mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium text-transfer transition hover:glass-active disabled:opacity-60 md:mt-3 md:py-2.5"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Parsing…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload screenshot
          </>
        )}
      </button>
    </div>
  )
}
