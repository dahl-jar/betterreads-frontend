import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { getBook } from '../api/getBook'

import sparseBookDetail from './mocks/book-detail-sparse.json'
import bookDetail from './mocks/book-detail.json'

const BOOK_URL = 'http://localhost:8080/api/v1/books/9780765312921'

function detailBody(overrides: Record<string, unknown> = {}) {
  return { ...bookDetail, ...overrides }
}

describe('getBook', () => {
  it('should return the parsed detail for a known key', async () => {
    server.use(http.get(BOOK_URL, () => HttpResponse.json({ data: detailBody() })))

    const book = await getBook('9780765312921')

    expect(book.title).toBe('Words of Radiance')
    expect(book.complete).toBe(true)
    expect(book.seriesName).toBe('The Stormlight Archive')
    expect(book.averageRating).toBe(4.76)
  })

  it('should parse every series', async () => {
    server.use(http.get(BOOK_URL, () => HttpResponse.json({ data: detailBody() })))

    const book = await getBook('9780765312921')

    expect(book.series).toEqual([
      { name: 'The Stormlight Archive', position: 2 },
      { name: 'The Cosmere', position: 12 },
    ])
  })

  it('should parse a sparse incomplete seed with most fields absent', async () => {
    server.use(http.get(BOOK_URL, () => HttpResponse.json({ data: sparseBookDetail })))

    const book = await getBook('9780765312921')

    expect(book.complete).toBe(false)
    expect(book.description).toBeUndefined()
    expect(book.coverUrl).toBeUndefined()
  })

  it('should throw when the book is not found', async () => {
    server.use(http.get(BOOK_URL, () => new HttpResponse(null, { status: 404 })))

    await expect(getBook('9780765312921')).rejects.toThrow()
  })

  it('should reject a payload missing a required field', async () => {
    server.use(http.get(BOOK_URL, () => HttpResponse.json({ data: { key: '9780765312921' } })))

    await expect(getBook('9780765312921')).rejects.toThrow()
  })
})
