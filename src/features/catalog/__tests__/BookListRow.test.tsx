import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import catalogCard from '@/testing/mocks/catalog-card.json'
import { render, screen, within } from '@/testing/test-utils'

import type { BookCard } from '../api/getBookList'
import { BookListRow } from '../components/BookListRow'

type RowState = { status: 'loading' | 'success' | 'error'; cards: BookCard[] }

const ALPHA: BookCard = { ...catalogCard, key: 'a', title: 'Alpha' }
const BRAVO: BookCard = { ...catalogCard, key: 'b', title: 'Bravo' }

function renderRow(state: RowState) {
  return render(
    <BookListRow
      title="Top rated"
      note="By reader score"
      state={state}
      labelOf={(card, index) => `No. ${index + 1} of ${card.key}`}
    />,
    { wrapper: MemoryRouter },
  )
}

function renderCards(...cards: BookCard[]) {
  return renderRow({ status: 'success', cards })
}

describe('BookListRow', () => {
  it('should link each book to its page under the row title', () => {
    renderCards(ALPHA, BRAVO)

    const row = screen.getByRole('region', { name: 'Top rated' })
    expect(within(row).getByText('By reader score')).toBeInTheDocument()
    const items = within(row).getAllByRole('listitem')
    const links = items.map((item) => within(item).getByRole('link'))
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/books/a', '/books/b'])
    expect(links[0]).toHaveAccessibleName(/Alpha/)
    expect(links[1]).toHaveAccessibleName(/Bravo/)
  })

  it('should label each card', () => {
    renderCards(ALPHA, BRAVO)

    const [first, second] = screen.getAllByRole('listitem')
    expect(within(first!).getByText('No. 1 of a')).toBeInTheDocument()
    expect(within(second!).getByText('No. 2 of b')).toBeInTheDocument()
  })

  it('should show only the first author', () => {
    renderCards({ ...ALPHA, authors: ['Frank Herbert', 'Brian Herbert'] })

    expect(screen.getByText('Frank Herbert')).toBeInTheDocument()
    expect(screen.queryByText(/Brian Herbert/)).toBeNull()
  })

  it('should show the score of a rated book with no rating count', () => {
    renderCards({ ...ALPHA, averageRating: 4.71, ratingCount: 1_400_000 })

    expect(screen.getByText(/(^|\s)4\.71$/)).toBeInTheDocument()
    expect(screen.queryByText(/1,400,000/)).toBeNull()
  })

  it.each([{ ratingCount: null }, { ratingCount: 0 }])(
    'should show no score for a rating count of $ratingCount',
    ({ ratingCount }) => {
      renderCards({ ...ALPHA, averageRating: 4.71, ratingCount })

      expect(screen.getByRole('link', { name: /Alpha/ })).toBeInTheDocument()
      expect(screen.queryByText(/4\.7/)).toBeNull()
    },
  )

  it('should show an alert when the list failed to load', () => {
    renderRow({ status: 'error', cards: [] })

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load this list. Try again in a moment.',
    )
  })

  it('should say when the list has no books', () => {
    renderRow({ status: 'success', cards: [] })

    expect(screen.getByText('No books here yet.')).toBeInTheDocument()
  })
})
