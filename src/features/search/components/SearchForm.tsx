import { ScanBarcode } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

type SearchFormProps = {
  onSearch: (query: string) => void
  initialQuery?: string
}

export function SearchForm({ onSearch, initialQuery = '' }: SearchFormProps) {
  return <SearchFormFields key={initialQuery} onSearch={onSearch} initialQuery={initialQuery} />
}

function SearchFormFields({ onSearch, initialQuery }: Required<SearchFormProps>) {
  const [query, setQuery] = useState(initialQuery)
  const [showScanHint, setShowScanHint] = useState(false)
  const scanHintId = useId()
  const scanRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showScanHint) {
      return
    }
    const onPointerDown = (event: PointerEvent) => {
      if (scanRef.current && !scanRef.current.contains(event.target as Node)) {
        setShowScanHint(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowScanHint(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [showScanHint])

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const trimmed = query.trim()
        if (trimmed !== '') {
          onSearch(trimmed)
        }
      }}
      role="search"
      className="flex items-stretch overflow-visible rounded-xl border border-line bg-surface shadow-sm focus-within:border-green"
    >
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Try &ldquo;dune&rdquo; or &ldquo;sanderson&rdquo;&hellip;"
        aria-label="Search the book catalog by title, series, or author"
        autoComplete="off"
        className="min-w-0 flex-1 rounded-l-xl bg-transparent px-5 py-4 text-ink outline-none placeholder:text-ink-faint"
      />
      <div ref={scanRef} className="relative flex">
        <button
          type="button"
          onClick={() => setShowScanHint((shown) => !shown)}
          aria-label="Scan a barcode"
          aria-controls={scanHintId}
          aria-expanded={showScanHint}
          className="flex items-center border-l border-line px-4 text-ink-soft hover:text-green"
        >
          <ScanBarcode className="h-5 w-5" aria-hidden="true" />
        </button>
        {showScanHint ? (
          <div
            id={scanHintId}
            role="status"
            className="absolute right-0 top-full z-20 mt-3 w-64 rounded-lg border border-line bg-surface p-4 text-left text-sm text-ink-soft shadow-lg"
          >
            <span
              aria-hidden="true"
              className="absolute -top-1.5 right-5 h-3 w-3 rotate-45 border-l border-t border-line bg-surface"
            />
            <span className="inline-flex rounded-full bg-rust/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-rust">
              In development
            </span>
            <p className="mt-2 font-semibold text-ink">Scan a book&apos;s barcode</p>
            <p className="mt-1">
              Point your camera at the back of a book to add it. We&apos;re building this. For now,
              type a title, series, or author.
            </p>
          </div>
        ) : null}
      </div>
      <button
        type="submit"
        className="rounded-r-xl bg-green px-7 font-semibold text-white hover:bg-green-deep"
      >
        Search
      </button>
    </form>
  )
}
