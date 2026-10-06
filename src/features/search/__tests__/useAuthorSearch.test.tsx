import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { holdResponse } from '@/testing/holdResponse'
import authorHit from '@/testing/mocks/author-search-hit.json'
import { server } from '@/testing/msw-server'

import { useAuthorSearch } from '../hooks/useAuthorSearch'

const AUTHORS_URL = 'http://localhost:8080/api/v1/search/authors'

const SETTLE_MS = 300

describe('useAuthorSearch', () => {
  it('should ignore a stale response', async () => {
    const staleSent = holdResponse()
    const staleHeld = holdResponse()
    server.use(
      http.get(AUTHORS_URL, async ({ request }) => {
        const query = new URL(request.url).searchParams.get('q')
        if (query === 'tolk') {
          staleSent.release()
          await staleHeld.held
          return HttpResponse.json({
            data: [{ ...authorHit, authorId: 1, name: 'Christopher Tolkien' }],
            meta: { total: 1, offset: 0, limit: 8 },
          })
        }
        return HttpResponse.json({ data: [authorHit], meta: { total: 1, offset: 0, limit: 8 } })
      }),
    )
    const { result, rerender } = renderHook(({ query }) => useAuthorSearch(query), {
      initialProps: { query: 'tolk' },
    })
    await staleSent.held

    rerender({ query: 'tolkien' })
    await waitFor(() => expect(result.current.status).toBe('success'))
    staleHeld.release()

    await waitFor(() =>
      expect(result.current.hits.map((hit) => hit.name)).toEqual(['J.R.R. Tolkien']),
    )
  })

  it('should stay idle for a blank query', async () => {
    let requested = false
    server.use(
      http.get(AUTHORS_URL, () => {
        requested = true
        return HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 8 } })
      }),
    )

    const { result } = renderHook(() => useAuthorSearch('   '))

    await expect(
      waitFor(() => expect(requested).toBe(true), { timeout: SETTLE_MS }),
    ).rejects.toThrow()
    expect(result.current.status).toBe('idle')
  })

  it('should report an error on a server failure', async () => {
    server.use(http.get(AUTHORS_URL, () => new HttpResponse(null, { status: 500 })))

    const { result } = renderHook(() => useAuthorSearch('tolkien'))

    await waitFor(() => expect(result.current.status).toBe('error'))
  })
})
