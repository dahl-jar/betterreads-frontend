import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'

import { getBook } from '../api/getBook'

const BOOK_URL = 'http://localhost:8080/api/v1/books/9780765312921'

function detailBody(overrides: Record<string, unknown> = {}) {
  return {
    key: '9780765312921',
    complete: true,
    title: 'Hunters of Dune',
    authors: ['Brian Herbert'],
    description: 'A Dune universe novel.',
    coverUrl: 'https://covers.example/9780765312921.jpg',
    firstPublishYear: 2006,
    isbn: '9780765312921',
    pageCount: 512,
    averageRating: 3.9,
    ratingCount: 12000,
    seriesName: 'Dune',
    seriesPosition: 7,
    subjects: ['Science fiction'],
    awards: [],
    ...overrides,
  }
}

describe('getBook', () => {
  it('should return the parsed detail for a known key', async () => {
    server.use(http.get(BOOK_URL, () => HttpResponse.json({ data: detailBody() })))

    const book = await getBook('9780765312921')

    expect(book.title).toBe('Hunters of Dune')
    expect(book.complete).toBe(true)
    expect(book.seriesName).toBe('Dune')
    expect(book.averageRating).toBe(3.9)
  })

  it('should parse a sparse incomplete seed with most fields absent', async () => {
    server.use(
      http.get(BOOK_URL, () =>
        HttpResponse.json({
          data: {
            key: '9780765312921',
            complete: false,
            title: 'Hunters of Dune',
            authors: ['Brian Herbert'],
            subjects: [],
            awards: [],
          },
        }),
      ),
    )

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
