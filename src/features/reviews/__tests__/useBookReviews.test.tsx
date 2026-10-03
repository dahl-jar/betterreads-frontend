import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/app/components/AuthProvider'
import { setRefreshHandler } from '@/lib/api/client'
import { clearAccessToken } from '@/lib/api/token'
import { stubSignedIn, stubSignedOut } from '@/testing/authHandlers'
import { holdResponse } from '@/testing/holdResponse'
import auth from '@/testing/mocks/auth.json'
import review from '@/testing/mocks/review.json'
import { server } from '@/testing/msw-server'

import { type Review } from '../api/reviewSchemas'
import { useBookReviews } from '../hooks/useBookReviews'

const BASE = 'http://localhost:8080/api/v1'
const AUTH_BASE = `${BASE}/auth`
const BOOK_REVIEWS_URL = `${BASE}/books/OL1W/reviews`
const OWN_REVIEWS_URL = `${BASE}/me/reviews`
const OWN_REVIEW_URL = `${BASE}/books/OL1W/reviews/me`
const BOOK_PAGE_LIMIT = 20
const OWN_PAGE_LIMIT = 100
const OTHER_REVIEW = { ...review, id: 2, rating: 3 }

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  )
}

function reviewPage(reviews: Review[], limit = BOOK_PAGE_LIMIT) {
  return HttpResponse.json({ data: reviews, meta: { total: reviews.length, offset: 0, limit } })
}

function stubBookReviews(reviews: Review[]) {
  server.use(http.get(BOOK_REVIEWS_URL, () => reviewPage(reviews)))
}

function stubOwnReviews(reviews: Review[]) {
  server.use(http.get(OWN_REVIEWS_URL, () => reviewPage(reviews, OWN_PAGE_LIMIT)))
}

async function loadReviews() {
  const { result } = renderHook(() => useBookReviews('OL1W'), { wrapper })
  await waitFor(() => expect(result.current.status).toBe('success'))
  return result
}

function stubReaderWithoutReviews() {
  stubSignedIn()
  stubBookReviews([])
  stubOwnReviews([])
}

afterEach(() => {
  clearAccessToken()
  setRefreshHandler(undefined)
})

describe('useBookReviews', () => {
  it('should load reviews for an anonymous reader', async () => {
    stubSignedOut()
    stubBookReviews([review, OTHER_REVIEW])

    const result = await loadReviews()

    expect(result.current.reviews).toHaveLength(2)
    expect(result.current.myReview).toBeUndefined()
  })

  it("should separate the signed-in reader's own review from the rest", async () => {
    stubSignedIn()
    stubBookReviews([review, OTHER_REVIEW])
    stubOwnReviews([review])

    const { result } = renderHook(() => useBookReviews('OL1W'), { wrapper })

    await waitFor(() => expect(result.current.myReview?.id).toBe(1))
    expect(result.current.reviews.map((entry) => entry.id)).toEqual([2])
  })

  it('should clear the previous book reviews while a new book loads', async () => {
    stubSignedOut()
    const nextReviewsStarted = holdResponse()
    const nextReviews = holdResponse()
    server.use(
      http.get(`${BASE}/books/:key/reviews`, async ({ params }) => {
        if (params.key === 'OL1W') {
          return reviewPage([review])
        }
        nextReviewsStarted.release()
        await nextReviews.held
        return reviewPage([{ ...review, id: 2, bookKey: 'OL2W', title: 'The next book' }])
      }),
    )
    const { rerender, result } = renderHook(
      ({ bookKey }: { bookKey: string }) => useBookReviews(bookKey),
      { initialProps: { bookKey: 'OL1W' }, wrapper },
    )
    await waitFor(() => expect(result.current.reviews[0]?.bookKey).toBe('OL1W'))

    rerender({ bookKey: 'OL2W' })
    await nextReviewsStarted.held

    expect(result.current.status).toBe('loading')
    expect(result.current.reviews).toEqual([])

    nextReviews.release()
    await waitFor(() => expect(result.current.reviews[0]?.bookKey).toBe('OL2W'))
  })

  it('should report an error when the book reviews cannot be loaded', async () => {
    stubSignedOut()
    server.use(http.get(BOOK_REVIEWS_URL, () => new HttpResponse(null, { status: 503 })))

    const { result } = renderHook(() => useBookReviews('OL1W'), { wrapper })

    await waitFor(() => expect(result.current.status).toBe('error'))
  })

  it('should keep reviews visible during a sign-in refetch', async () => {
    let ownLookupStarted = false
    const session = holdResponse()
    const ownLookup = holdResponse()
    stubBookReviews([review])
    server.use(
      http.post(`${AUTH_BASE}/refresh`, async () => {
        await session.held
        return HttpResponse.json({ data: { ...auth, accessToken: 'jwt' } })
      }),
      http.get(OWN_REVIEWS_URL, async () => {
        ownLookupStarted = true
        await ownLookup.held
        return reviewPage([], OWN_PAGE_LIMIT)
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

    session.release()
    await waitFor(() => expect(ownLookupStarted).toBe(true))

    const firstSuccess = statuses.indexOf('success')
    expect(firstSuccess).toBeGreaterThanOrEqual(0)
    expect(statuses.slice(firstSuccess)).not.toContain('loading')

    ownLookup.release()
    await waitFor(() => expect(result.current.myReviewReady).toBe(true))
  })

  it('should keep reviews read-only after ownership lookup fails', async () => {
    stubSignedIn()
    stubBookReviews([review, OTHER_REVIEW])
    server.use(http.get(OWN_REVIEWS_URL, () => new HttpResponse(null, { status: 503 })))

    const result = await loadReviews()

    expect(result.current.reviews).toHaveLength(2)
    expect(result.current.myReview).toBeUndefined()
    expect(result.current.myReviewReady).toBe(false)
  })

  it('should mark ownership pending during lookup', async () => {
    stubSignedIn()
    let ownLookupStarted = false
    const ownLookup = holdResponse()
    stubBookReviews([review])
    server.use(
      http.get(OWN_REVIEWS_URL, async () => {
        ownLookupStarted = true
        await ownLookup.held
        return reviewPage([{ ...review, id: 9, bookKey: 'OL1W' }], OWN_PAGE_LIMIT)
      }),
    )

    const { result } = renderHook(() => useBookReviews('OL1W'), { wrapper })

    await waitFor(() => expect(ownLookupStarted).toBe(true))
    expect(result.current.myReviewReady).toBe(false)

    ownLookup.release()
    await waitFor(() => expect(result.current.myReviewReady).toBe(true))
    expect(result.current.myReview?.id).toBe(9)
  })

  it('should mark ownership ready when anonymous', async () => {
    stubSignedOut()
    stubBookReviews([review])

    const result = await loadReviews()

    expect(result.current.myReviewReady).toBe(true)
  })

  it("should save a review as the reader's review", async () => {
    stubReaderWithoutReviews()
    server.use(
      http.put(OWN_REVIEW_URL, () => HttpResponse.json({ data: { ...review, id: 9, rating: 4 } })),
    )
    const { result } = renderHook(() => useBookReviews('OL1W'), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('success'))

    await result.current.save({ rating: 4 })

    await waitFor(() => expect(result.current.myReview?.id).toBe(9))
  })

  it('should notify after a save', async () => {
    stubReaderWithoutReviews()
    server.use(
      http.put(OWN_REVIEW_URL, () => HttpResponse.json({ data: { ...review, id: 9, rating: 4 } })),
    )
    const onReviewChange = vi.fn()
    const { result } = renderHook(() => useBookReviews('OL1W', onReviewChange), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('success'))

    await result.current.save({ rating: 4 })

    expect(onReviewChange).toHaveBeenCalledTimes(1)
  })

  it('should clear the own review after a delete', async () => {
    stubSignedIn()
    stubBookReviews([])
    stubOwnReviews([{ ...review, id: 9 }])
    server.use(http.delete(OWN_REVIEW_URL, () => new HttpResponse(null, { status: 204 })))

    const { result } = renderHook(() => useBookReviews('OL1W'), { wrapper })
    await waitFor(() => expect(result.current.myReview?.id).toBe(9))

    await result.current.remove()

    await waitFor(() => expect(result.current.myReview).toBeUndefined())
  })
})
