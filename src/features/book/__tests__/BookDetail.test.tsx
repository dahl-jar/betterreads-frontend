import { beforeEach, describe, expect, it } from 'vitest'

import { stubSignedOut } from '@/testing/authHandlers'
import { renderWithProviders, screen, within } from '@/testing/test-utils'

import type { BookDetail as BookDetailData } from '../api/getBook'
import { BookDetail } from '../components/BookDetail'

import sparseBookDetail from './mocks/book-detail-sparse.json'
import bookDetail from './mocks/book-detail.json'

const fullBook: BookDetailData = {
  ...bookDetail,
  title: 'Hunters of Dune',
  subtitle: 'Sequel to Chapterhouse',
  authors: ['Brian Herbert', 'Kevin J. Anderson'],
  description: 'A Dune universe novel.',
  averageRating: 3.9,
  seriesName: 'Dune',
  seriesPosition: 7,
  series: undefined,
}

const LONG_DESCRIPTION = Array.from({ length: 60 }, (_, index) => `Sentence ${index}.`).join(' ')

function seriesHref(name: string) {
  return `/series/${name}`
}

function authorHref(name: string) {
  return `/authors/${name}`
}

describe('BookDetail', () => {
  beforeEach(() => {
    stubSignedOut()
  })

  it('should show the book details', () => {
    renderWithProviders(
      <BookDetail book={fullBook} seriesHref={seriesHref} authorHref={authorHref} />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Hunters of Dune' })).toBeInTheDocument()
    expect(screen.getByText('Sequel to Chapterhouse')).toBeInTheDocument()
    expect(screen.getByText(/Brian Herbert/)).toBeInTheDocument()
    expect(screen.getByText('Dune #7')).toBeInTheDocument()
    expect(screen.getByText('A Dune universe novel.')).toBeInTheDocument()
  })

  it('should collapse a long description', () => {
    renderWithProviders(
      <BookDetail
        book={{ ...fullBook, description: LONG_DESCRIPTION }}
        seriesHref={seriesHref}
        authorHref={authorHref}
      />,
    )

    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument()
  })

  it('should link each author to the given target', () => {
    renderWithProviders(
      <BookDetail book={fullBook} seriesHref={seriesHref} authorHref={authorHref} />,
    )

    const brian = screen.getByRole('link', { name: 'Brian Herbert' })
    const kevin = screen.getByRole('link', { name: 'Kevin J. Anderson' })

    expect(brian).toHaveAttribute('href', '/authors/Brian Herbert')
    expect(kevin).toHaveAttribute('href', '/authors/Kevin J. Anderson')
    expect(brian.parentElement).toHaveTextContent(/^Brian Herbert, Kevin J. Anderson$/)
  })

  it('should say when the book has no known author', () => {
    renderWithProviders(
      <BookDetail
        book={{ ...fullBook, authors: [] }}
        seriesHref={seriesHref}
        authorHref={authorHref}
      />,
    )

    const fallback = screen.getByText('Author unknown')

    expect(fallback.closest('a')).toBeNull()
    expect(fallback.parentElement).toHaveTextContent(/^Author unknown/)
  })

  it('should link the series to the given target', () => {
    renderWithProviders(
      <BookDetail book={fullBook} seriesHref={seriesHref} authorHref={authorHref} />,
    )

    const seriesLink = screen.getByRole('link', { name: 'Dune #7' })

    expect(seriesLink).toHaveAttribute('href', '/series/Dune')
  })

  it('should link every series', () => {
    renderWithProviders(
      <BookDetail book={bookDetail} seriesHref={seriesHref} authorHref={authorHref} />,
    )

    const stormlight = screen.getByRole('link', { name: 'The Stormlight Archive #2' })
    const cosmere = screen.getByRole('link', { name: 'The Cosmere #12' })

    expect(stormlight).toHaveAttribute('href', '/series/The Stormlight Archive')
    expect(cosmere).toHaveAttribute('href', '/series/The Cosmere')
  })

  it('should link the primary series when series is empty', () => {
    renderWithProviders(
      <BookDetail
        book={{ ...fullBook, series: [] }}
        seriesHref={seriesHref}
        authorHref={authorHref}
      />,
    )

    const seriesLink = screen.getByRole('link', { name: 'Dune #7' })

    expect(seriesLink).toHaveAttribute('href', '/series/Dune')
  })

  it('should show the Hardcover rating of the book', () => {
    renderWithProviders(
      <BookDetail book={fullBook} seriesHref={seriesHref} authorHref={authorHref} />,
    )

    const hardcover = screen.getByRole('group', { name: 'Hardcover' })

    expect(within(hardcover).getByText(/3\.9/)).toBeInTheDocument()
    expect(within(hardcover).getByText('300,000 ratings')).toBeInTheDocument()
  })

  it('should prefer the given Hardcover rating', () => {
    renderWithProviders(
      <BookDetail
        book={fullBook}
        hardcoverRating={{ average: 4.25, count: 1_400_000 }}
        seriesHref={seriesHref}
        authorHref={authorHref}
      />,
    )

    const hardcover = screen.getByRole('group', { name: 'Hardcover' })

    expect(within(hardcover).getByText(/4\.25/)).toBeInTheDocument()
    expect(within(hardcover).getByText('1,400,000 ratings')).toBeInTheDocument()
  })

  it('should say when the book has no Hardcover rating', () => {
    const noRating: BookDetailData = {
      ...fullBook,
      averageRating: undefined,
      ratingCount: undefined,
    }
    renderWithProviders(
      <BookDetail book={noRating} seriesHref={seriesHref} authorHref={authorHref} />,
    )

    const hardcover = screen.getByRole('group', { name: 'Hardcover' })

    expect(within(hardcover).getByText('No ratings yet')).toBeInTheDocument()
  })

  it('should note that details are still arriving', () => {
    renderWithProviders(
      <BookDetail book={sparseBookDetail} seriesHref={seriesHref} authorHref={authorHref} />,
    )

    expect(screen.getByText(/still gathering the full details/)).toBeInTheDocument()
  })
})
