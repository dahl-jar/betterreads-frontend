import { useState } from 'react'

import { SearchIcon } from '@/components/icons'

type SearchFormVariant = 'hero' | 'header'

type SearchFormProps = {
  onSearch: (query: string) => void
  initialQuery?: string
  variant?: SearchFormVariant
}

type VariantClasses = {
  form: string
  field: string
  icon: string
  input: string
  button: string
}

const INPUT_CLASS =
  'w-full rounded-md border border-rule bg-raised pr-4 text-fg outline-none placeholder:text-fg-3'

const VARIANT_CLASSES: Record<SearchFormVariant, VariantClasses> = {
  hero: {
    form: 'flex max-w-xl items-stretch gap-2',
    field: 'relative min-w-0 flex-1',
    icon: 'left-4 size-5',
    input: `${INPUT_CLASS} h-12 pl-12 focus:border-brand md:h-14`,
    button: 'rounded-md bg-accent px-4 font-semibold text-on-accent hover:bg-accent-hover md:px-6',
  },
  header: {
    form: 'relative min-w-0 flex-1 md:max-w-md',
    field: 'relative',
    icon: 'left-3.5 size-4',
    input: `${INPUT_CLASS} h-10 pl-10 focus:border-fg-2`,
    button: 'sr-only',
  },
}

const PLACEHOLDER: Record<SearchFormVariant, string> = {
  hero: 'Try “dune” or “sanderson”',
  header: 'Search title, series, or author',
}

export function SearchForm({ onSearch, initialQuery = '', variant = 'hero' }: SearchFormProps) {
  return (
    <SearchFormFields
      key={initialQuery}
      onSearch={onSearch}
      initialQuery={initialQuery}
      variant={variant}
    />
  )
}

function SearchFormFields({ onSearch, initialQuery, variant }: Required<SearchFormProps>) {
  const [query, setQuery] = useState(initialQuery)
  const classes = VARIANT_CLASSES[variant]

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
      className={classes.form}
    >
      <div className={classes.field}>
        <SearchIcon
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-fg-3 ${classes.icon}`}
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={PLACEHOLDER[variant]}
          aria-label="Search the book catalog by title, series, or author"
          autoComplete="off"
          className={classes.input}
        />
      </div>
      <button type="submit" className={classes.button}>
        Search
      </button>
    </form>
  )
}
