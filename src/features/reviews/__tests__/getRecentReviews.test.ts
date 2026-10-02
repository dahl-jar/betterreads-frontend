import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import recentReview from '@/testing/mocks/recent-review.json'
import { server } from '@/testing/msw-server'

import { getRecentReviews } from '../api/getRecentReviews'

const RECENT_URL = 'http://localhost:8080/api/v1/reviews/recent'

function stubRecent(items: unknown[]) {
  server.use(http.get(RECENT_URL, () => HttpResponse.json({ data: items })))
}

function without(source: Record<string, unknown>, ...fields: string[]) {
  return Object.fromEntries(Object.entries(source).filter(([name]) => !fields.includes(name)))
}

describe('getRecentReviews', () => {
  it('should request the given limit', async () => {
    let requestedLimit: string | null = null
    server.use(
      http.get(RECENT_URL, ({ request }) => {
        requestedLimit = new URL(request.url).searchParams.get('limit')
        return HttpResponse.json({ data: [recentReview] })
      }),
    )

    await getRecentReviews(6)

    expect(requestedLimit).toBe('6')
  })

  it('should return the parsed reviews', async () => {
    stubRecent([recentReview])

    const reviews = await getRecentReviews(6)

    expect(reviews).toEqual([recentReview])
  })

  it('should parse a review with no rating, title, or cover', async () => {
    const bare = {
      ...without(recentReview, 'rating', 'title'),
      book: without(recentReview.book, 'coverUrl'),
    }
    stubRecent([bare])

    const reviews = await getRecentReviews(6)

    expect(reviews).toEqual([bare])
  })

  it.each(['author', 'book'])('should reject a review with no %s', async (field) => {
    stubRecent([without(recentReview, field)])

    await expect(getRecentReviews(6)).rejects.toBeInstanceOf(ZodError)
  })
})
