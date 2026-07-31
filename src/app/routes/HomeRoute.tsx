import { useNavigate } from 'react-router-dom'

import { BookListSection } from '@/features/catalog/components/BookListSection'
import { SearchForm } from '@/features/search/components/SearchForm'

export function HomeRoute() {
  const navigate = useNavigate()

  const runSearch = (query: string) => {
    void navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-2xl px-6 py-12 text-center">
        <h1 className="font-display text-5xl font-semibold leading-tight tracking-tight text-ink">
          Find your <em className="not-italic text-rust">next</em> book
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
          Search a catalog merged from every source we can find.
        </p>
        <div className="mt-8">
          <SearchForm onSearch={runSearch} />
        </div>
      </section>
      <BookListSection />
    </main>
  )
}
