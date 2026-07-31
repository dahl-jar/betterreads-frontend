import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/app/components/AuthProvider'
import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn, stubSignedOut } from '@/testing/authHandlers'
import auth from '@/testing/mocks/auth.json'
import { server } from '@/testing/msw-server'

import { useBookReviews } from '../hooks/useBookReviews'

import review from './mocks/review.json'

const BASE = 'http://localhost:8080/api/v1'
const AUTH_BASE = `${BASE}/auth`

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  )
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('useBookReviews', () => {
  it('should load reviews for an anonymous reader', async () => {
    stubSignedOut()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({
          data: [review, { ...review, id: 2, rating: 3 }],
          meta: { total: 2, offset: 0, limit: 20 },
        }),
      ),
    )

    const { result } = renderHook(() => useBookReviews('OL1W'), { wrapper })

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.reviews).toHaveLength(2)
    expect(result.current.myReview).toBeUndefined()
  })

  it("should separate the signed-in reader's own review from the rest", async () => {
    stubSignedIn()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({
          data: [review, { ...review, id: 2, rating: 3 }],
          meta: { total: 2, offset: 0, limit: 20 },
        }),
      ),
      http.get(`${BASE}/me/reviews`, () =>
        HttpResponse.json({ data: [review], meta: { total: 1, offset: 0, limit: 100 } }),
      ),
    )

    const { result } = renderHook(() => useBookReviews('OL1W'), { wrapper })

    await waitFor(() => expect(result.current.myReview?.id).toBe(1))
    expect(result.current.reviews.map((entry) => entry.id)).toEqual([2])
  })

  it('should clear the previous book reviews while a new book loads', async () => {
    stubSignedOut()
    let markNextReviewsStarted: () => void = () => undefined
    let releaseNextReviews: () => void = () => undefined
    const nextReviewsStarted = new Promise<void>((resolve) => {
      markNextReviewsStarted = resolve
    })
    const heldNextReviews = new Promise<void>((resolve) => {
      releaseNextReviews = resolve
    })
    server.use(
      http.get(`${BASE}/books/:key/reviews`, async ({ params }) => {
        if (params.key === 'OL1W') {
          return HttpResponse.json({
            data: [review],
            meta: { total: 1, offset: 0, limit: 20 },
          })
        }
        markNextReviewsStarted()
        await heldNextReviews
        return HttpResponse.json({
          data: [{ ...review, id: 2, bookKey: 'OL2W', title: 'The next book' }],
          meta: { total: 1, offset: 0, limit: 20 },
        })
      }),
    )
    const { rerender, result } = renderHook(
      ({ bookKey }: { bookKey: string }) => useBookReviews(bookKey),
      { initialProps: { bookKey: 'OL1W' }, wrapper },
    )
    await waitFor(() => expect(result.current.reviews[0]?.bookKey).toBe('OL1W'))

    rerender({ bookKey: 'OL2W' })
    await nextReviewsStarted

    expect(result.current.status).toBe('loading')
    expect(result.current.reviews).toEqual([])

    releaseNextReviews()
    await waitFor(() => expect(result.current.reviews[0]?.bookKey).toBe('OL2W'))
  })

  it('should report an error when the book reviews cannot be loaded', async () => {
    stubSignedOut()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () => new HttpResponse(null, { status: 503 })),
    )

    const { result } = renderHook(() => useBookReviews('OL1W'), { wrapper })

    await waitFor(() => expect(result.current.status).toBe('error'))
  })

  it('should keep reviews visible during a sign-in refetch', async () => {
    let releaseSession: () => void = () => undefined
    let ownLookupStarted = false
    let releaseOwnLookup: () => void = () => undefined
    const heldSession = new Promise<void>((resolve) => {
      releaseSession = resolve
    })
    const heldOwnLookup = new Promise<void>((resolve) => {
      releaseOwnLookup = resolve
    })
    server.use(
      http.post(`${AUTH_BASE}/refresh`, async () => {
        await heldSession
        return HttpResponse.json({ data: { ...auth, accessToken: 'jwt' } })
      }),
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({ data: [review], meta: { total: 1, offset: 0, limit: 20 } }),
      ),
      http.get(`${BASE}/me/reviews`, async () => {
        ownLookupStarted = true
        await heldOwnLookup
        return HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 100 } })
      }),
    )

    const statuses: string[] = []
    const { result } = renderHook(
      () => {
        const value = useBookReviews('OL1W')
        statuses.push(value.status)
        return value
      },
      { wrapper },
    )
    await waitFor(() => expect(result.current.reviews).toHaveLength(1))
    expect(result.current.status).toBe('success')

    releaseSession()
    await waitFor(() => expect(ownLookupStarted).toBe(true))

    const firstSuccess = statuses.indexOf('success')
    expect(firstSuccess).toBeGreaterThanOrEqual(0)
    expect(statuses.slice(firstSuccess)).not.toContain('loading')

    releaseOwnLookup()
    await waitFor(() => expect(result.current.myReviewReady).toBe(true))
  })

  it('should keep reviews read-only after ownership lookup fails', async () => {
    stubSignedIn()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({
          data: [review, { ...review, id: 2, rating: 3 }],
          meta: { total: 2, offset: 0, limit: 20 },
        }),
      ),
      http.get(`${BASE}/me/reviews`, () => new HttpResponse(null, { status: 503 })),
    )

    const { result } = renderHook(() => useBookReviews('OL1W'), { wrapper })

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.reviews).toHaveLength(2)
    expect(result.current.myReview).toBeUndefined()
    expect(result.current.myReviewReady).toBe(false)
  })

  it('should mark ownership pending during lookup', async () => {
    stubSignedIn()
    let ownLookupStarted = false
    let releaseOwnLookup: () => void = () => undefined
    const heldOwnLookup = new Promise<void>((resolve) => {
      releaseOwnLookup = resolve
    })
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({ data: [review], meta: { total: 1, offset: 0, limit: 20 } }),
      ),
      http.get(`${BASE}/me/reviews`, async () => {
        ownLookupStarted = true
        await heldOwnLookup
        return HttpResponse.json({
          data: [{ ...review, id: 9, bookKey: 'OL1W' }],
          meta: { total: 1, offset: 0, limit: 100 },
        })
      }),
    )

    const { result } = renderHook(() => useBookReviews('OL1W'), { wrapper })

    await waitFor(() => expect(ownLookupStarted).toBe(true))
    expect(result.current.myReviewReady).toBe(false)

    releaseOwnLookup()
    await waitFor(() => expect(result.current.myReviewReady).toBe(true))
    expect(result.current.myReview?.id).toBe(9)
  })

  it('should mark ownership ready when anonymous', async () => {
    stubSignedOut()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({ data: [review], meta: { total: 1, offset: 0, limit: 20 } }),
      ),
    )

    const { result } = renderHook(() => useBookReviews('OL1W'), { wrapper })

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.myReviewReady).toBe(true)
  })

  it("should save a review as the reader's review", async () => {
    stubSignedIn()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } }),
      ),
      http.get(`${BASE}/me/reviews`, () =>
        HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 100 } }),
      ),
      http.put(`${BASE}/books/OL1W/reviews/me`, () =>
        HttpResponse.json({ data: { ...review, id: 9, rating: 4 } }),
      ),
    )

    const { result } = renderHook(() => useBookReviews('OL1W'), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('success'))

    await result.current.save({ rating: 4 })

    await waitFor(() => expect(result.current.myReview?.id).toBe(9))
  })

  it('should notify after a save', async () => {
    stubSignedIn()
    const onReviewChange = vi.fn()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } }),
      ),
      http.get(`${BASE}/me/reviews`, () =>
        HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 100 } }),
      ),
      http.put(`${BASE}/books/OL1W/reviews/me`, () =>
        HttpResponse.json({ data: { ...review, id: 9, rating: 4 } }),
      ),
    )

    const { result } = renderHook(() => useBookReviews('OL1W', onReviewChange), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('success'))

    await result.current.save({ rating: 4 })

    expect(onReviewChange).toHaveBeenCalledTimes(1)
  })

  it('should clear the own review after a delete', async () => {
    stubSignedIn()
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } }),
      ),
      http.get(`${BASE}/me/reviews`, () =>
        HttpResponse.json({
          data: [{ ...review, id: 9 }],
          meta: { total: 1, offset: 0, limit: 100 },
        }),
      ),
      http.delete(`${BASE}/books/OL1W/reviews/me`, () => new HttpResponse(null, { status: 204 })),
    )

    const { result } = renderHook(() => useBookReviews('OL1W'), { wrapper })
    await waitFor(() => expect(result.current.myReview?.id).toBe(9))

    await result.current.remove()

    await waitFor(() => expect(result.current.myReview).toBeUndefined())
  })
})
