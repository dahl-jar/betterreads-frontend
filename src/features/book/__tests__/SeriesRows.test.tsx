import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import bookSeries from '@/testing/mocks/book-series.json'
import { render, screen, within } from '@/testing/test-utils'

import type { BookDetail } from '../api/getBook'
import type { BookSeries } from '../api/getBookSeries'
import { SeriesRows } from '../components/SeriesRows'

import bookDetail from './mocks/book-detail.json'

const RED_RISING_ROW = 'Also in Red Rising Saga'
const SUN_EATER_ROW = 'Also in Sun Eater'

const RED_RISING: BookDetail = {
  ...bookDetail,
  key: 'OL26W',
  title: 'Red Rising',
  authors: ['Pierce Brown'],
}

const [goldenSon, morningStar] = bookSeries.books

const THIRD_OF_FOUR: BookSeries = {
  ...bookSeries,
  position: 3,
  books: [goldenSon!, { ...morningStar!, position: 4 }],
}

const SUN_EATER: BookSeries = {
  name: 'Sun Eater',
  position: 4,
  books: [{ ...goldenSon!, key: 'OL40W', title: 'Empire of Silence', position: 1 }],
}

function renderRows(...series: BookSeries[]) {
  return render(<SeriesRows book={RED_RISING} series={series} />, { wrapper: MemoryRouter })
}

describe('SeriesRows', () => {
  it('should link the other books to their pages', () => {
    renderRows(bookSeries)

    const row = screen.getByRole('region', { name: RED_RISING_ROW })
    const links = within(row).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/books/OL27W', '/books/OL28W'])
    expect(links[0]).toHaveAccessibleName(/Golden Son.*Pierce Brown/)
    expect(links[1]).toHaveAccessibleName(/Morning Star.*Pierce Brown/)
  })

  it('should show the open book at its place in the series', () => {
    renderRows(THIRD_OF_FOUR)

    const [first, second, third] = screen.getAllByRole('listitem')

    expect(within(first!).getByText('Golden Son')).toBeInTheDocument()
    expect(within(second!).getByText('Red Rising')).toBeInTheDocument()
    expect(within(third!).getByText('Morning Star')).toBeInTheDocument()
  })

  it('should show the open book with no link', () => {
    renderRows(bookSeries)

    const [openBook] = screen.getAllByRole('listitem')

    expect(openBook).toHaveTextContent(/Red Rising.*Pierce Brown/)
    expect(within(openBook!).queryByRole('link')).toBeNull()
  })

  it('should mark the open book as the current one', () => {
    renderRows(bookSeries)

    const current = screen.getByRole('listitem', { current: true })

    expect(within(current).getByText('Red Rising')).toBeInTheDocument()
  })

  it('should label each book with its place in the series', () => {
    renderRows(THIRD_OF_FOUR)

    const [first, second, third] = screen.getAllByRole('listitem')
    expect(within(first!).getByText('Book 2')).toBeInTheDocument()
    expect(within(second!).getByText('Book 3')).toBeInTheDocument()
    expect(within(third!).getByText('Book 4')).toBeInTheDocument()
  })

  it('should leave out a series with no other books', () => {
    renderRows({ ...bookSeries, books: [] }, SUN_EATER)

    expect(screen.getByRole('region', { name: SUN_EATER_ROW })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: RED_RISING_ROW })).toBeNull()
  })

  it('should render nothing when no series has other books', () => {
    const { container } = renderRows({ ...bookSeries, books: [] })

    expect(container).toBeEmptyDOMElement()
  })
})
