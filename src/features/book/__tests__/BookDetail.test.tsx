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
  contributors: [
    { authorId: 11, name: 'Brian Herbert', role: 'AUTHOR' },
    { authorId: 12, name: 'Kevin J. Anderson', role: 'AUTHOR' },
  ],
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

function authorHref(authorId: number) {
  return `/authors/${authorId}`
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

  it('should link authors by id', () => {
    renderWithProviders(
      <BookDetail book={fullBook} seriesHref={seriesHref} authorHref={authorHref} />,
    )

    const brian = screen.getByRole('link', { name: 'Brian Herbert' })
    const kevin = screen.getByRole('link', { name: 'Kevin J. Anderson' })

    expect(brian).toHaveAttribute('href', '/authors/11')
    expect(kevin).toHaveAttribute('href', '/authors/12')
    expect(brian.parentElement).toHaveTextContent(/^Brian Herbert, Kevin J. Anderson$/)
  })

  it('should show the illustrator line', () => {
    const illustrated = {
      ...fullBook,
      contributors: [
        ...fullBook.contributors,
        { authorId: 13, name: 'Marc Simonetti', role: 'ILLUSTRATOR' },
        { authorId: 14, name: 'Studio Hands', role: 'OTHER' },
      ],
    }

    renderWithProviders(
      <BookDetail book={illustrated} seriesHref={seriesHref} authorHref={authorHref} />,
    )

    expect(screen.getByText(/Illustrated by/)).toHaveTextContent('Illustrated by Marc Simonetti')
    expect(screen.queryByText('Studio Hands')).not.toBeInTheDocument()
  })

  it('should list an editor with the authors', () => {
    const anthology = {
      ...fullBook,
      contributors: [
        { authorId: 21, name: 'Stephen Jones', role: 'EDITOR' },
        { authorId: 22, name: 'H. P. Lovecraft', role: 'AUTHOR' },
      ],
    }

    renderWithProviders(
      <BookDetail book={anthology} seriesHref={seriesHref} authorHref={authorHref} />,
    )

    expect(screen.getByRole('link', { name: 'H. P. Lovecraft' }).parentElement).toHaveTextContent(
      /^Stephen Jones, H\. P\. Lovecraft$/,
    )
  })

  it('should show names without links when the book has no contributors', () => {
    renderWithProviders(
      <BookDetail
        book={{ ...fullBook, contributors: [] }}
        seriesHref={seriesHref}
        authorHref={authorHref}
      />,
    )

    expect(screen.getByText(/Brian Herbert/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Brian Herbert' })).not.toBeInTheDocument()
  })

  it('should say when the book has no known author', () => {
    renderWithProviders(
      <BookDetail
        book={{ ...fullBook, authors: [], contributors: [] }}
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

  it('should show a decimal series number', () => {
    const edgedancer = {
      ...bookDetail,
      seriesPosition: 2.5,
      series: [{ name: 'The Stormlight Archive', position: 2.5 }],
    }

    renderWithProviders(
      <BookDetail book={edgedancer} seriesHref={seriesHref} authorHref={authorHref} />,
    )

    expect(screen.getByRole('link', { name: 'The Stormlight Archive #2.5' })).toBeInTheDocument()
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
