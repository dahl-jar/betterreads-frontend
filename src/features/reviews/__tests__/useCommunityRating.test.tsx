import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { useCommunityRating } from '../hooks/useCommunityRating'

const RATING_BASE = 'http://localhost:8080/api/v1/books'

function rating(average: number) {
  return { average, count: 2, distribution: [{ star: 5, count: 2 }] }
}

describe('useCommunityRating', () => {
  it('should clear a stale rating while loading', async () => {
    let markNextRatingStarted: () => void = () => undefined
    let releaseNextRating: () => void = () => undefined
    const nextRatingStarted = new Promise<void>((resolve) => {
      markNextRatingStarted = resolve
    })
    const heldNextRating = new Promise<void>((resolve) => {
      releaseNextRating = resolve
    })
    server.use(
      http.get(`${RATING_BASE}/:key/community-rating`, async ({ params }) => {
        if (params.key === 'OL1W') {
          return HttpResponse.json({ data: rating(4.5) })
        }
        markNextRatingStarted()
        await heldNextRating
        return HttpResponse.json({ data: rating(3.5) })
      }),
    )
    const { rerender, result } = renderHook(
      ({ bookKey, refreshToken }) => useCommunityRating(bookKey, refreshToken),
      { initialProps: { bookKey: 'OL1W', refreshToken: 0 } },
    )
    await waitFor(() => expect(result.current?.average).toBe(4.5))

    rerender({ bookKey: 'OL2W', refreshToken: 0 })
    await nextRatingStarted

    expect(result.current).toBeUndefined()

    releaseNextRating()
    await waitFor(() => expect(result.current?.average).toBe(3.5))
  })

  it('should clear the previous rating when a refresh fails', async () => {
    let requestCount = 0
    let failedRequestReturned = false
    server.use(
      http.get(`${RATING_BASE}/OL1W/community-rating`, () => {
        requestCount += 1
        if (requestCount === 1) {
          return HttpResponse.json({ data: rating(4.5) })
        }
        failedRequestReturned = true
        return new HttpResponse(null, { status: 400 })
      }),
    )
    const { rerender, result } = renderHook(
      ({ refreshToken }) => useCommunityRating('OL1W', refreshToken),
      { initialProps: { refreshToken: 0 } },
    )
    await waitFor(() => expect(result.current?.average).toBe(4.5))

    rerender({ refreshToken: 1 })
    await waitFor(() => expect(failedRequestReturned).toBe(true))

    await waitFor(() => expect(result.current).toBeUndefined())
  })

  it('should load the rating again when the refresh token changes', async () => {
    let requestCount = 0
    server.use(
      http.get(`${RATING_BASE}/OL1W/community-rating`, () => {
        requestCount += 1
        return HttpResponse.json({ data: rating(requestCount) })
      }),
    )
    const { rerender, result } = renderHook(
      ({ refreshToken }) => useCommunityRating('OL1W', refreshToken),
      { initialProps: { refreshToken: 0 } },
    )
    await waitFor(() => expect(result.current?.average).toBe(1))

    rerender({ refreshToken: 1 })

    await waitFor(() => expect(result.current?.average).toBe(2))
  })
})
