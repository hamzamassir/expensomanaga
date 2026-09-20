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
      className={`rounded-2xl border-2 border-dashed p-4 transition ${
        dragging ? 'border-transfer bg-transfer/5' : 'border-border bg-card'
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
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-transfer/10 p-2">
          <Sparkles className="h-5 w-5 text-transfer" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">AI Screenshot Import (Demo)</h3>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            Drop a banking app screenshot to simulate OCR parsing. Demo mode adds sample
            transactions — no data leaves your browser.
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
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-transfer/30 bg-transfer/10 py-2.5 text-sm font-medium text-transfer transition hover:bg-transfer/20 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Parsing screenshot…
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
