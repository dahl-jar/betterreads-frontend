import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FakeEventSource } from '@/testing/fakeEventSource'
import { holdResponse } from '@/testing/holdResponse'
import searchHit from '@/testing/mocks/search-hit.json'
import { server } from '@/testing/msw-server'

import { PAGE_SIZE, useSearch } from '../hooks/useSearch'

const SEARCH_URL = 'http://localhost:8080/api/v1/search/books'

function makeHits(count: number, offset = 0) {
  return Array.from({ length: count }, (_, index) => ({
    ...searchHit,
    bookId: `book-${offset + index}`,
    title: `Book ${offset + index}`,
    authors: ['An Author'],
    subjects: [],
    popularityScore: 1,
  }))
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

async function searchWithoutHits() {
  server.use(pageOf(0))
  const { result } = renderHook(() => useSearch('an obscure title'))
  await waitFor(() => expect(result.current.status).toBe('staging'))
  return result
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

  it('should offer a next page when more hits remain', async () => {
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

  it('should say the book is being looked for when a search finds nothing', async () => {
    const result = await searchWithoutHits()

    expect(result.current.hits).toEqual([])
  })

  it('should report an error status when the search request fails', async () => {
    server.use(http.get(SEARCH_URL, () => new HttpResponse(null, { status: 503 })))

    const { result } = renderHook(() => useSearch('dune'))

    await waitFor(() => expect(result.current.status).toBe('error'))
  })

  it('should clear previous results when the query changes', async () => {
    const nextSearchStarted = holdResponse()
    const heldNextSearch = holdResponse()
    server.use(
      http.get(SEARCH_URL, async ({ request }) => {
        const query = new URL(request.url).searchParams.get('q')
        if (query === 'dune') {
          return pagedResponse(makeHits(1), 1, 0, PAGE_SIZE + 1)
        }
        nextSearchStarted.release()
        await heldNextSearch.held
        return pagedResponse(makeHits(1, 1), 1, 0, PAGE_SIZE + 1)
      }),
    )
    const { result, rerender } = renderHook(({ query }) => useSearch(query), {
      initialProps: { query: 'dune' },
    })
    await waitFor(() => expect(result.current.status).toBe('success'))

    rerender({ query: 'mistborn' })
    await nextSearchStarted.held

    expect(result.current.status).toBe('loading')
    expect(result.current.hits).toEqual([])

    heldNextSearch.release()
    await waitFor(() => expect(result.current.status).toBe('success'))
  })

  describe('live hits', () => {
    beforeEach(() => {
      vi.stubGlobal('EventSource', FakeEventSource)
    })

    it('should show streamed hits when the search had none', async () => {
      const result = await searchWithoutHits()

      FakeEventSource.instances[0]!.emit('search-hit', searchHit)
      FakeEventSource.instances[0]!.emit('search-hit', { ...searchHit, bookId: 'second' })

      await waitFor(() => expect(result.current.status).toBe('success'))
      expect(result.current.hits.map((hit) => hit.bookId)).toEqual([searchHit.bookId, 'second'])
    })

    it('should ignore a streamed hit already in the results', async () => {
      server.use(pageOf(1))
      const { result } = renderHook(() => useSearch('dune'))
      await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))

      FakeEventSource.instances[0]!.emit('search-hit', { ...searchHit, bookId: 'book-0' })

      await waitFor(() => expect(result.current.status).toBe('success'))
      expect(result.current.hits).toHaveLength(1)
    })

    it('should not open a stream for a later page', async () => {
      server.use(pageOf(3 * PAGE_SIZE))

      const { result } = renderHook(() => useSearch('dune', 2))

      await waitFor(() => expect(result.current.status).toBe('success'))
      expect(FakeEventSource.instances).toHaveLength(0)
    })

    it('should close the stream when the query changes', async () => {
      server.use(pageOf(1))
      const { result, rerender } = renderHook(({ query }) => useSearch(query), {
        initialProps: { query: 'dune' },
      })
      await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1))

      rerender({ query: 'mistborn' })

      await waitFor(() => expect(result.current.status).toBe('success'))
      expect(FakeEventSource.instances[0]?.closed).toBe(true)
    })
  })
})
