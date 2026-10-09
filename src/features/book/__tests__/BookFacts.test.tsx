import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { render, screen } from '@/testing/test-utils'

import type { BookDetail } from '../api/getBook'
import { BookFacts } from '../components/BookFacts'

import sparseBookDetail from './mocks/book-detail-sparse.json'
import bookDetail from './mocks/book-detail.json'

const ONE_SERIES: BookDetail = {
  ...bookDetail,
  seriesName: 'Red Rising Saga',
  seriesPosition: 1,
  series: [{ name: 'Red Rising Saga', position: 1 }],
}

const GENRES_WITH_REPEAT = [
  'Fantasy',
  'fantasy',
  'Adventure',
  'War',
  'Magic',
  'Politics',
  'Honor',
  'Storms',
  'Knights',
  'Spren',
]
const GENRE_PAST_LIMIT = 'Spren'

const APPLE_BOOKS_URL = 'https://books.apple.com/us/book/the-way-of-kings/id1'

const READ_STAMP = { label: 'Read', date: 'Feb 14, 2026', tone: 'read' } as const
const MALFORMED_LANGUAGE = 'en_US'

function seriesHref(name: string) {
  return `/series/${name}`
}

function renderFacts(book: BookDetail, stamp?: typeof READ_STAMP) {
  return render(<BookFacts book={book} seriesHref={seriesHref} stamp={stamp} />, {
    wrapper: MemoryRouter,
  })
}

function shownFacts() {
  return screen
    .queryAllByRole('term')
    .map((term) => [term.textContent, term.nextElementSibling?.textContent])
}

describe('BookFacts', () => {
  it('should list the facts of the book', () => {
    const language = new Intl.DisplayNames(undefined, { type: 'language' }).of('en')

    renderFacts(ONE_SERIES)

    expect(shownFacts()).toEqual([
      ['Pages', '1,087'],
      ['Published', '2014'],
      ['ISBN', bookDetail.isbn],
      ['Language', language],
      ['Series', 'Red Rising Saga #1'],
      ['Genres', 'Fantasy'],
    ])
  })

  it('should head the card with the title and authors', () => {
    renderFacts({ ...bookDetail, authors: ['Pierce Brown', 'Christopher Ruocchio'] })

    expect(screen.getByText(bookDetail.title)).toBeInTheDocument()
    expect(screen.getByText('Pierce Brown, Christopher Ruocchio')).toBeInTheDocument()
  })

  it('should show a language code it cannot name as written', () => {
    renderFacts({ ...bookDetail, language: MALFORMED_LANGUAGE })

    expect(shownFacts()).toContainEqual(['Language', MALFORMED_LANGUAGE])
  })

  it('should link every series', () => {
    renderFacts(bookDetail)

    const stormlight = screen.getByRole('link', { name: 'The Stormlight Archive #2' })
    const cosmere = screen.getByRole('link', { name: 'The Cosmere #12' })

    expect(stormlight).toHaveAttribute('href', '/series/The Stormlight Archive')
    expect(cosmere).toHaveAttribute('href', '/series/The Cosmere')
  })

  it('should show no more than eight genres', () => {
    renderFacts({ ...bookDetail, subjects: GENRES_WITH_REPEAT })

    expect(screen.getByText('Knights')).toBeInTheDocument()
    expect(screen.getAllByText('Fantasy')).toHaveLength(1)
    expect(screen.queryByText(GENRE_PAST_LIMIT)).toBeNull()
  })

  it('should list the awards', () => {
    renderFacts({ ...bookDetail, awards: ['Hugo Award'] })

    expect(screen.getByText('Hugo Award')).toBeInTheDocument()
  })

  it('should leave out the facts the book lacks', () => {
    renderFacts(sparseBookDetail)

    expect(shownFacts()).toEqual([])
  })

  it('should link to Apple Books', () => {
    const language = new Intl.DisplayNames(undefined, { type: 'language' }).of('en')

    renderFacts({ ...ONE_SERIES, appleBooksUrl: APPLE_BOOKS_URL })

    expect(shownFacts().slice(3, 5)).toEqual([
      ['Language', language],
      ['Ebook', 'Apple Books'],
    ])
    expect(screen.getByRole('link', { name: 'Apple Books' })).toHaveAttribute(
      'href',
      APPLE_BOOKS_URL,
    )
  })

  it('should hide the row for a look-alike host', () => {
    renderFacts({
      ...bookDetail,
      appleBooksUrl: 'https://books.apple.com.example.test/us/book/id1',
    })

    expect(screen.queryByText('Ebook')).toBeNull()
  })

  it('should show the stamp', () => {
    renderFacts(bookDetail, READ_STAMP)

    expect(screen.getByText(READ_STAMP.label)).toBeInTheDocument()
    expect(screen.getByText(READ_STAMP.date)).toBeInTheDocument()
  })
})
