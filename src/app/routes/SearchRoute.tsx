import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Pagination } from '@/components/Pagination'
import { SearchForm } from '@/features/search/components/SearchForm'
import { SearchResults } from '@/features/search/components/SearchResults'
import { useSearch } from '@/features/search/hooks/useSearch'

function parsePage(raw: string | null): number {
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1
}

export function SearchRoute() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') ?? ''
  const page = parsePage(searchParams.get('page'))
  const { status, hits, hasNextPage } = useSearch(query, page)

  const goToSearch = (nextQuery: string, nextPage: number) => {
    const params = new URLSearchParams({ q: nextQuery })
    if (nextPage > 1) {
      params.set('page', String(nextPage))
    }
    void navigate(`/search?${params.toString()}`)
    window.scrollTo({ top: 0 })
  }

  const pagedPastEnd = status === 'success' && hits.length === 0 && page > 1
  useEffect(() => {
    if (pagedPastEnd) {
      void navigate(`/search?q=${encodeURIComponent(query)}`, { replace: true })
    }
  }, [pagedPastEnd, query, navigate])

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-5 font-display text-3xl font-semibold text-ink">Search</h1>
      <SearchForm onSearch={(next) => goToSearch(next, 1)} initialQuery={query} />
      {status === 'success' ? (
        <p className="mt-6 border-b border-line pb-2 text-sm text-ink-soft">
          Results for <span className="font-semibold text-ink">{query}</span>
        </p>
      ) : null}
      <SearchResults status={status} hits={hits} query={query} />
      {status === 'success' ? (
        <Pagination
          page={page}
          hasNext={hasNextPage}
          ariaLabel="Search result pages"
          onPageChange={(nextPage) => goToSearch(query, nextPage)}
        />
      ) : null}
    </main>
  )
}
