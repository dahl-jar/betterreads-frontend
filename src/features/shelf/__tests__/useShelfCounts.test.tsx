import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import shelfCounts from '@/testing/mocks/shelf-counts.json'
import { server } from '@/testing/msw-server'

import { useShelfCounts } from '../hooks/useShelfCounts'

const BOOKS_BASE = 'http://localhost:8080/api/v1/books'

describe('useShelfCounts', () => {
  it('should clear the previous counts while the next book loads', async () => {
    let markNextCountsStarted: () => void = () => undefined
    let releaseNextCounts: () => void = () => undefined
    const nextCountsStarted = new Promise<void>((resolve) => {
      markNextCountsStarted = resolve
    })
    const heldNextCounts = new Promise<void>((resolve) => {
      releaseNextCounts = resolve
    })
    server.use(
      http.get(`${BOOKS_BASE}/:key/shelf-counts`, async ({ params }) => {
        if (params.key === 'OL1W') {
          return HttpResponse.json(shelfCounts)
        }
        markNextCountsStarted()
        await heldNextCounts
        return HttpResponse.json({ data: { ...shelfCounts.data, finished: 99 } })
      }),
    )
    const { rerender, result } = renderHook(({ bookKey }) => useShelfCounts(bookKey), {
      initialProps: { bookKey: 'OL1W' },
    })
    await waitFor(() => expect(result.current?.finished).toBe(40))

    rerender({ bookKey: 'OL2W' })
    await nextCountsStarted

    expect(result.current).toBeUndefined()

    releaseNextCounts()
    await waitFor(() => expect(result.current?.finished).toBe(99))
  })
})
