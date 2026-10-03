import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { holdResponse } from '@/testing/holdResponse'
import shelfCounts from '@/testing/mocks/shelf-counts.json'
import { server } from '@/testing/msw-server'

import { useShelfCounts } from '../hooks/useShelfCounts'

const BOOKS_BASE = 'http://localhost:8080/api/v1/books'

describe('useShelfCounts', () => {
  it('should clear the previous counts while the next book loads', async () => {
    const nextCountsStarted = holdResponse()
    const heldNextCounts = holdResponse()
    server.use(
      http.get(`${BOOKS_BASE}/:key/shelf-counts`, async ({ params }) => {
        if (params.key === 'OL1W') {
          return HttpResponse.json(shelfCounts)
        }
        nextCountsStarted.release()
        await heldNextCounts.held
        return HttpResponse.json({ data: { ...shelfCounts.data, finished: 99 } })
      }),
    )
    const { rerender, result } = renderHook(({ bookKey }) => useShelfCounts(bookKey), {
      initialProps: { bookKey: 'OL1W' },
    })
    await waitFor(() => expect(result.current?.finished).toBe(40))

    rerender({ bookKey: 'OL2W' })
    await nextCountsStarted.held

    expect(result.current).toBeUndefined()

    heldNextCounts.release()
    await waitFor(() => expect(result.current?.finished).toBe(99))
  })
})
