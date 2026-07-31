import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { searchBooks } from '../api/searchBooks'

import searchHit from './mocks/search-hit.json'

const SEARCH_URL = 'http://localhost:8080/api/v1/search/books'

function pagedBody(
  hits: Record<string, unknown>[] = [defaultHit()],
  meta: Record<string, unknown> = { total: hits.length, offset: 0, limit: 20 },
) {
  return { data: hits, meta }
}

function defaultHit() {
  return { ...searchHit, bookId: 'book-1', popularityScore: 8.4 }
}

describe('searchBooks', () => {
  it('should map a search page', async () => {
    server.use(http.get(SEARCH_URL, () => HttpResponse.json(pagedBody())))

    const result = await searchBooks({ query: 'dune' })

    expect(result.totalHits).toBe(1)
    expect(result.hits[0]?.title).toBe('Dune')
    expect(result.hits[0]?.authors).toEqual(['Frank Herbert'])
  })

  it('should send the search parameters', async () => {
    let requestUrl = ''
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        requestUrl = request.url
        return HttpResponse.json(pagedBody())
      }),
    )

    await searchBooks({ query: 'name of the wind', offset: 20, limit: 10 })

    const params = new URL(requestUrl).searchParams
    expect(params.get('q')).toBe('name of the wind')
    expect(params.get('offset')).toBe('20')
    expect(params.get('limit')).toBe('10')
  })

  it('should reject a hit missing a required field', async () => {
    server.use(http.get(SEARCH_URL, () => HttpResponse.json(pagedBody([{ bookId: 'x' }]))))

    await expect(searchBooks({ query: 'dune' })).rejects.toThrow()
  })
})
