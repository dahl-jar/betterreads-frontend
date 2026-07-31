import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { deleteMyReview } from '../api/deleteMyReview'
import { findMyReviewForBook } from '../api/findMyReviewForBook'
import { getBookReviews } from '../api/getBookReviews'
import { upsertMyReview } from '../api/upsertMyReview'

import { makeReview } from './mocks/review'

const BASE = 'http://localhost:8080/api/v1'

function pageOf(reviews: Record<string, unknown>[], total: number, offset: number, limit: number) {
  return HttpResponse.json({ data: reviews, meta: { total, offset, limit } })
}

describe('getBookReviews', () => {
  it("should return a page of a book's reviews with its total", async () => {
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, () =>
        pageOf([makeReview(), makeReview({ id: 6, rating: 3 })], 2, 0, 20),
      ),
    )

    const page = await getBookReviews('OL1W')

    expect(page.reviews).toHaveLength(2)
    expect(page.total).toBe(2)
    expect(page.reviews[0]?.rating).toBe(5)
  })

  it('should pass pagination query params', async () => {
    let url = ''
    server.use(
      http.get(`${BASE}/books/OL1W/reviews`, ({ request }) => {
        url = request.url
        return pageOf([], 50, 20, 20)
      }),
    )

    await getBookReviews('OL1W', 20, 20)

    const params = new URL(url).searchParams
    expect(params.get('offset')).toBe('20')
    expect(params.get('limit')).toBe('20')
  })

  it('should parse a rating-only review with no title or body', async () => {
    const ratingOnly = { id: 6, bookKey: 'OL1W', rating: 4, createdAt: '2026-06-01' }
    server.use(http.get(`${BASE}/books/OL1W/reviews`, () => pageOf([ratingOnly], 1, 0, 20)))

    const page = await getBookReviews('OL1W')

    expect(page.reviews[0]?.title).toBeUndefined()
    expect(page.reviews[0]?.body).toBeUndefined()
  })
})

describe('upsertMyReview', () => {
  it('should return the saved review', async () => {
    let sentBody: unknown
    server.use(
      http.put(`${BASE}/books/OL1W/reviews/me`, async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json({ data: makeReview() })
      }),
    )

    const saved = await upsertMyReview('OL1W', {
      rating: 5,
      title: 'A desert epic',
      body: 'Spice.',
    })

    expect(sentBody).toEqual({ rating: 5, title: 'A desert epic', body: 'Spice.' })
    expect(saved.id).toBe(1)
  })
})

describe('deleteMyReview', () => {
  it('should delete a review', async () => {
    let method = ''
    server.use(
      http.delete(`${BASE}/books/OL1W/reviews/me`, ({ request }) => {
        method = request.method
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await expect(deleteMyReview('OL1W')).resolves.toBeUndefined()
    expect(method).toBe('DELETE')
  })
})

describe('findMyReviewForBook', () => {
  it("should return the caller's review for the book from the first page", async () => {
    server.use(
      http.get(`${BASE}/me/reviews`, () =>
        pageOf([makeReview({ id: 8, bookKey: 'OL2W' }), makeReview()], 2, 0, 20),
      ),
    )

    const own = await findMyReviewForBook('OL1W')

    expect(own?.id).toBe(1)
  })

  it('should find a review on a later page', async () => {
    server.use(
      http.get(`${BASE}/me/reviews`, ({ request }) => {
        const offset = Number(new URL(request.url).searchParams.get('offset') ?? '0')
        if (offset === 0) {
          return pageOf([makeReview({ id: 8, bookKey: 'OL2W' })], 2, 0, 1)
        }
        return pageOf([makeReview()], 2, 1, 1)
      }),
    )

    const own = await findMyReviewForBook('OL1W')

    expect(own?.id).toBe(1)
  })

  it('should return undefined without a review', async () => {
    server.use(
      http.get(`${BASE}/me/reviews`, () =>
        pageOf([makeReview({ id: 8, bookKey: 'OL2W' })], 1, 0, 20),
      ),
    )

    const own = await findMyReviewForBook('OL1W')

    expect(own).toBeUndefined()
  })
})
