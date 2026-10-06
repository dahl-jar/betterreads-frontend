import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import authorHit from '@/testing/mocks/author-search-hit.json'
import { server } from '@/testing/msw-server'

import { searchAuthors } from '../api/searchAuthors'

const AUTHORS_URL = 'http://localhost:8080/api/v1/search/authors'

function page(hits: unknown[]) {
  return HttpResponse.json({ data: hits, meta: { total: hits.length, offset: 0, limit: 8 } })
}

describe('searchAuthors', () => {
  it('should map hits', async () => {
    server.use(http.get(AUTHORS_URL, () => page([authorHit])))

    const hits = await searchAuthors({ query: 'tolkien' })

    expect(hits[0]?.name).toBe('J.R.R. Tolkien')
    expect(hits[0]?.bookCount).toBe(57)
  })

  it('should send query params', async () => {
    let requestUrl = ''
    server.use(
      http.get(AUTHORS_URL, ({ request }) => {
        requestUrl = request.url
        return page([])
      }),
    )

    await searchAuthors({ query: 'ursula le guin', limit: 8 })

    const params = new URL(requestUrl).searchParams
    expect(params.get('q')).toBe('ursula le guin')
    expect(params.get('limit')).toBe('8')
  })

  it('should reject a bad shape', async () => {
    server.use(http.get(AUTHORS_URL, () => page([{ ...authorHit, authorId: 'twenty-nine' }])))

    await expect(searchAuthors({ query: 'tolkien' })).rejects.toBeInstanceOf(ZodError)
  })
})
