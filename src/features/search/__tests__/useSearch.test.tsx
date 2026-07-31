import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { PAGE_SIZE, useSearch } from '../hooks/useSearch'

import { makeSearchHit } from './mocks/searchHit'

const SEARCH_URL = 'http://localhost:8080/api/v1/search/books'

function makeHits(count: number, offset = 0) {
  return Array.from({ length: count }, (_, index) =>
    makeSearchHit({
      bookId: `book-${offset + index}`,
      title: `Book ${offset + index}`,
      authors: ['An Author'],
      subjects: [],
      popularityScore: 1,
    }),
  )
}

function pagedResponse(
  hits: ReturnType<typeof makeHits>,
  total: number,
  offset: number,
  limit: number,
) {
  return HttpResponse.json({ data: hits, meta: { total, offset, limit } })
}

function pageOf(available: number) {
  return http.get(SEARCH_URL, ({ request }) => {
    const params = new URL(request.url).searchParams
    const offset = Number(params.get('offset') ?? '0')
    const limit = Number(params.get('limit') ?? String(PAGE_SIZE))
    const remaining = Math.max(0, available - offset)
    const count = Math.min(limit, remaining)
    return pagedResponse(makeHits(count, offset), available, offset, limit)
  })
}

describe('useSearch', () => {
  it('should stay idle for an empty query', async () => {
    let requested = false
    server.use(
      http.get(SEARCH_URL, () => {
        requested = true
        return pagedResponse([], 0, 0, PAGE_SIZE)
      }),
    )

    const { result } = renderHook(() => useSearch(''))

    await waitFor(() => expect(result.current.status).toBe('idle'))
    expect(requested).toBe(false)
  })

  it('should return hits for a submitted query', async () => {
    server.use(pageOf(1))

    const { result } = renderHook(() => useSearch('dune'))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.hits).toHaveLength(1)
    expect(result.current.page).toBe(1)
  })

  it('should flag overflow beyond the page size', async () => {
    server.use(pageOf(40))

    const { result } = renderHook(() => useSearch('dune'))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.hits).toHaveLength(PAGE_SIZE)
    expect(result.current.hasNextPage).toBe(true)
  })

  it('should stop at the last full page', async () => {
    server.use(pageOf(3 * PAGE_SIZE))

    const { result } = renderHook(() => useSearch('sanderson', 3))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.hits).toHaveLength(PAGE_SIZE)
    expect(result.current.hasNextPage).toBe(false)
  })

  it('should request the right offset for a later page', async () => {
    let requestedOffset = ''
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        requestedOffset = new URL(request.url).searchParams.get('offset') ?? ''
        return pagedResponse(makeHits(PAGE_SIZE, 15), 120, 15, PAGE_SIZE + 1)
      }),
    )

    const { result } = renderHook(() => useSearch('dune', 2))

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(requestedOffset).toBe('15')
    expect(result.current.page).toBe(2)
  })

  it('should report a staging status when a query returns zero hits', async () => {
    server.use(pageOf(0))

    const { result } = renderHook(() => useSearch('an obscure title'))

    await waitFor(() => expect(result.current.status).toBe('staging'))
    expect(result.current.hits).toEqual([])
  })

  it('should report an error status when the search request fails', async () => {
    server.use(http.get(SEARCH_URL, () => new HttpResponse(null, { status: 503 })))

    const { result } = renderHook(() => useSearch('dune'))

    await waitFor(() => expect(result.current.status).toBe('error'))
  })

  it('should clear previous results when the query changes', async () => {
    let markNextSearchStarted: () => void = () => undefined
    let releaseNextSearch: () => void = () => undefined
    const nextSearchStarted = new Promise<void>((resolve) => {
      markNextSearchStarted = resolve
    })
    const heldNextSearch = new Promise<void>((resolve) => {
      releaseNextSearch = resolve
    })
    server.use(
      http.get(SEARCH_URL, async ({ request }) => {
        const query = new URL(request.url).searchParams.get('q')
        if (query === 'dune') {
          return pagedResponse(makeHits(1), 1, 0, PAGE_SIZE + 1)
        }
        markNextSearchStarted()
        await heldNextSearch
        return pagedResponse(makeHits(1, 1), 1, 0, PAGE_SIZE + 1)
      }),
    )
    const { result, rerender } = renderHook(({ query }) => useSearch(query), {
      initialProps: { query: 'dune' },
    })
    await waitFor(() => expect(result.current.status).toBe('success'))

    rerender({ query: 'mistborn' })
    await nextSearchStarted

    expect(result.current.status).toBe('loading')
    expect(result.current.hits).toEqual([])

    releaseNextSearch()
    await waitFor(() => expect(result.current.status).toBe('success'))
  })
})
