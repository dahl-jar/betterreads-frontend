import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import authorPage from '@/testing/mocks/author-page.json'
import { server } from '@/testing/msw-server'

import { getAuthor } from '../api/getAuthor'

const AUTHOR_URL = 'http://localhost:8080/api/v1/authors/87'

describe('getAuthor', () => {
  it('should parse the author page', async () => {
    server.use(http.get(AUTHOR_URL, () => HttpResponse.json({ data: authorPage })))

    const author = await getAuthor(87)

    expect(author.name).toBe('Brandon Sanderson')
    expect(author.books.map((book) => book.title)).toEqual(['The Way of Kings', 'Elantris'])
  })

  it('should reject a book without a role', async () => {
    const books = [{ ...authorPage.books[0], role: undefined }]
    server.use(http.get(AUTHOR_URL, () => HttpResponse.json({ data: { ...authorPage, books } })))

    await expect(getAuthor(87)).rejects.toBeInstanceOf(ZodError)
  })
})
