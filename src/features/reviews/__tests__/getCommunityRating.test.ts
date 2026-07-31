import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { getCommunityRating } from '../api/getCommunityRating'

const RATING_URL = 'http://localhost:8080/api/v1/books/dune/community-rating'

describe('getCommunityRating', () => {
  it('should parse the rating summary', async () => {
    server.use(
      http.get(RATING_URL, () =>
        HttpResponse.json({
          data: {
            average: 4.0,
            count: 2,
            distribution: [
              { star: 5, count: 1 },
              { star: 4, count: 0 },
              { star: 3, count: 1 },
              { star: 2, count: 0 },
              { star: 1, count: 0 },
            ],
          },
        }),
      ),
    )

    const rating = await getCommunityRating('dune')

    expect(rating.average).toBe(4.0)
    expect(rating.count).toBe(2)
    expect(rating.distribution).toHaveLength(5)
    expect(rating.distribution[0]).toEqual({ star: 5, count: 1 })
  })

  it('should parse an unrated book with a null average', async () => {
    server.use(
      http.get(RATING_URL, () =>
        HttpResponse.json({
          data: {
            average: null,
            count: 0,
            distribution: [
              { star: 5, count: 0 },
              { star: 4, count: 0 },
              { star: 3, count: 0 },
              { star: 2, count: 0 },
              { star: 1, count: 0 },
            ],
          },
        }),
      ),
    )

    const rating = await getCommunityRating('dune')

    expect(rating.average).toBeNull()
    expect(rating.count).toBe(0)
  })
})
