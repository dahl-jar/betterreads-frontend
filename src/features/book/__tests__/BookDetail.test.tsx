import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '@/testing/msw-server'
import { renderWithProviders, screen } from '@/testing/test-utils'

import type { BookDetail as BookDetailData } from '../api/getBook'
import { BookDetail } from '../components/BookDetail'

const fullBook: BookDetailData = {
  key: '9780765312921',
  complete: true,
  title: 'Hunters of Dune',
  authors: ['Brian Herbert', 'Kevin J. Anderson'],
  description: 'A Dune universe novel.',
  coverUrl: 'https://covers.example/cover.jpg',
  firstPublishYear: 2006,
  isbn: '9780765312921',
  pageCount: 512,
  language: 'en',
  averageRating: 3.9,
  ratingCount: 12000,
  seriesName: 'Dune',
  seriesPosition: 7,
  subjects: ['Science fiction', 'Space opera'],
  awards: ['Some Award'],
}

describe('BookDetail', () => {
  beforeEach(() => {
    server.use(
      http.post(
        'http://localhost:8080/api/v1/auth/refresh',
        () => new HttpResponse(null, { status: 401 }),
      ),
      http.get('http://localhost:8080/api/v1/books/:key/reviews', () =>
        HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: 20 } }),
      ),
      http.get('http://localhost:8080/api/v1/books/:key/community-rating', () =>
        HttpResponse.json({ data: { average: null, count: 0, distribution: [] } }),
      ),
    )
  })

  it('should show the book details', () => {
    renderWithProviders(<BookDetail book={fullBook} />)

    expect(screen.getByRole('heading', { name: /hunters of dune/i })).toBeInTheDocument()
    expect(screen.getByText(/Brian Herbert/)).toBeInTheDocument()
    expect(screen.getByText(/Dune.*#7|#7.*Dune/)).toBeInTheDocument()
    expect(screen.getByText(/3\.9/)).toBeInTheDocument()
    expect(screen.getByText('A Dune universe novel.')).toBeInTheDocument()
  })

  it('should link the series to a search for that series', () => {
    renderWithProviders(<BookDetail book={fullBook} />)

    const seriesLink = screen.getByRole('link', { name: /Dune.*#7|#7.*Dune/ })

    expect(seriesLink).toHaveAttribute('href', '/search?q=Dune')
  })

  it("should show the language name in the reader's locale", () => {
    const language = new Intl.DisplayNames(undefined, { type: 'language' }).of('en')

    renderWithProviders(<BookDetail book={fullBook} />)

    expect(screen.getByText(`Language: ${language}`)).toBeInTheDocument()
  })

  it('should omit the rating when none is present', () => {
    const noRating: BookDetailData = {
      ...fullBook,
      averageRating: undefined,
      ratingCount: undefined,
    }
    renderWithProviders(<BookDetail book={noRating} />)

    expect(screen.queryByText(/\d+ ratings/i)).not.toBeInTheDocument()
    expect(screen.queryByText('3.9')).not.toBeInTheDocument()
  })

  it('should note that details are still arriving', () => {
    const cold: BookDetailData = {
      key: '9780765312921',
      complete: false,
      title: 'Hunters of Dune',
      authors: ['Brian Herbert'],
      subjects: [],
      awards: [],
    }
    renderWithProviders(<BookDetail book={cold} />)

    expect(screen.getByText(/still (gathering|arriving)|filling in/i)).toBeInTheDocument()
  })
})
