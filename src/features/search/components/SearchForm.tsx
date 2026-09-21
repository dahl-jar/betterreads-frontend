import { useState } from 'react'

type SearchFormProps = {
  onSearch: (query: string) => void
  initialQuery?: string
}

export function SearchForm({ onSearch, initialQuery = '' }: SearchFormProps) {
  return <SearchFormFields key={initialQuery} onSearch={onSearch} initialQuery={initialQuery} />
}

function SearchFormFields({ onSearch, initialQuery }: Required<SearchFormProps>) {
  const [query, setQuery] = useState(initialQuery)

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
      <button
        type="submit"
        className="rounded-r-xl bg-green px-7 font-semibold text-white hover:bg-green-deep"
      >
        Search
      </button>
    </form>
  )
}
