import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Pagination } from '@/components/Pagination'
import { SearchResults } from '@/features/search/components/SearchResults'
import { useSearch } from '@/features/search/hooks/useSearch'

import { searchPath } from '../searchPath'

const HEADING_CLASS = 'font-title text-3xl tracking-tight text-fg md:text-4xl'

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

  const goToPage = (nextPage: number) => {
    void navigate(searchPath(query, nextPage))
    window.scrollTo({ top: 0 })
  }

  const pagedPastEnd = status === 'success' && hits.length === 0 && page > 1
  useEffect(() => {
    if (pagedPastEnd) {
      void navigate(searchPath(query), { replace: true })
    }
  }, [pagedPastEnd, query, navigate])

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:py-12">
      {query.trim() === '' ? (
        <>
          <h1 className={HEADING_CLASS}>Search</h1>
          <p className="mt-3 text-fg-2">Type a title, series, or author in the search box above.</p>
        </>
      ) : (
        <h1 className={HEADING_CLASS}>
          Results for <span className="italic text-brand">{query}</span>
        </h1>
      )}
      <SearchResults status={status} hits={hits} query={query} />
      {status === 'success' ? (
        <Pagination
          page={page}
          hasNext={hasNextPage}
          ariaLabel="Search result pages"
          onPageChange={goToPage}
        />
      ) : null}
    </main>
  )
}
