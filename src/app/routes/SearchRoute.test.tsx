import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedOut } from '@/testing/authHandlers'
import { CurrentLocation } from '@/testing/CurrentLocation'
import searchHit from '@/testing/mocks/search-hit.json'
import { server } from '@/testing/msw-server'
import { renderWithProviders, screen } from '@/testing/test-utils'

import { SearchRoute } from './SearchRoute'

const SEARCH_URL = 'http://localhost:8080/api/v1/search/books'
const FULL_PAGE_PLUS_ONE = 16

function stubSearch(hitCount: number) {
  const offsets: (string | null)[] = []
  stubSignedOut()
  server.use(
    http.get(SEARCH_URL, ({ request }) => {
      offsets.push(new URL(request.url).searchParams.get('offset'))
      const hits = Array.from({ length: hitCount }, (_, index) => ({
        ...searchHit,
        bookId: `book-${index}`,
        seriesName: null,
        seriesPosition: null,
      }))
      return HttpResponse.json({
        data: hits,
        meta: { total: hitCount, offset: 0, limit: hitCount },
      })
    }),
  )
  return { offsets }
}

function renderSearch(route: string) {
  return renderWithProviders(
    <>
      <SearchRoute />
      <CurrentLocation />
    </>,
    { route },
  )
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('SearchRoute', () => {
  it('should title the page with the query', async () => {
    stubSearch(1)

    renderSearch('/search?q=dune')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Results for dune' }),
    ).toBeInTheDocument()
  })

  it('should prompt for a query when there is none', () => {
    stubSignedOut()

    renderSearch('/search')

    expect(screen.getByRole('heading', { level: 1, name: 'Search' })).toBeInTheDocument()
    expect(
      screen.getByText('Type a title, series, or author in the search box above.'),
    ).toBeInTheDocument()
  })

  it('should load the next page of the same query on Next', async () => {
    vi.stubGlobal('scrollTo', vi.fn())
    const { offsets } = stubSearch(FULL_PAGE_PLUS_ONE)
    const { user } = renderSearch('/search?q=dune')

    await user.click(await screen.findByRole('button', { name: 'Next' }))

    expect(await screen.findByText('Page 2')).toBeInTheDocument()
    expect(screen.getByText('/search?q=dune&page=2')).toBeInTheDocument()
    expect(offsets).toEqual(['0', '15'])
  })

  it('should show the first page for a page number it cannot read', async () => {
    const { offsets } = stubSearch(1)

    renderSearch('/search?q=dune&page=abc')

    await screen.findByRole('link', { name: /Dune/ })
    expect(offsets).toEqual(['0'])
  })

  it('should return to the first page from a page past the end', async () => {
    stubSearch(0)

    renderSearch('/search?q=dune&page=2')

    expect(await screen.findByText('/search?q=dune')).toBeInTheDocument()
  })
})
