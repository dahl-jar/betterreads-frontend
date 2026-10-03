import { type KeyboardEvent, useRef } from 'react'

import { ClearIcon, SearchIcon } from '@/components/icons'

type ShelfSearchProps = {
  query: string
  onQueryChange: (query: string) => void
}

export function ShelfSearch({ query, onQueryChange }: ShelfSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const clear = () => {
    onQueryChange('')
    inputRef.current?.focus()
  }

  const clearOnEscape = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && query) {
      event.preventDefault()
      clear()
    }
  }

  return (
    <div role="search" className="relative w-full sm:w-auto sm:min-w-0 sm:max-w-sm sm:flex-1">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-3" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={clearOnEscape}
        placeholder="Search my books"
        aria-label="Search my books by title or author"
        autoComplete="off"
        enterKeyHint="search"
        className="h-9 w-full rounded-md border border-rule bg-raised pl-9 pr-9 text-fg outline-none placeholder:text-fg-3 focus:border-fg-2 [&::-webkit-search-cancel-button]:hidden"
      />
      {query ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-fg-3 hover:bg-sunken hover:text-fg"
        >
          <ClearIcon className="size-4" />
        </button>
      ) : null}
    </div>
  )
}
