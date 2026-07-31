import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { getBookList } from '../api/getBookList'

const LIST_URL = 'http://localhost:8080/api/v1/books'

describe('getBookList', () => {
  it('should return a parsed book list', async () => {
    let requestedList: string | null = null
    let requestedLimit: string | null = null
    server.use(
      http.get(LIST_URL, ({ request }) => {
        const params = new URL(request.url).searchParams
        requestedList = params.get('list')
        requestedLimit = params.get('limit')
        return HttpResponse.json({
          data: [
            {
              key: 'dune',
              title: 'Dune',
              authors: ['Frank Herbert'],
              coverUrl: 'https://covers.example/dune.jpg',
              firstPublishYear: 1965,
              averageRating: 4.25,
              ratingCount: 1_400_000,
            },
          ],
        })
      }),
    )

    const cards = await getBookList('TOP_RATED')

    expect(requestedList).toBe('TOP_RATED')
    expect(requestedLimit).toBe('20')
    expect(cards).toHaveLength(1)
    expect(cards[0]?.title).toBe('Dune')
    expect(cards[0]?.averageRating).toBe(4.25)
  })
})
