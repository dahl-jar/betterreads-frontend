import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import catalogCard from '@/testing/mocks/catalog-card.json'
import { render, screen } from '@/testing/test-utils'

import type { BookCard } from '../api/getBookList'
import { NewBookCard } from '../components/NewBookCard'

function renderCard(card: BookCard) {
  return render(<NewBookCard card={card} />, { wrapper: MemoryRouter })
}

describe('NewBookCard', () => {
  it('should link to the new book', () => {
    renderCard({ ...catalogCard, authors: ['Frank Herbert', 'Brian Herbert'] })

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/books/OL893415W')
    expect(link).toHaveTextContent('New in the catalog')
    expect(link).toHaveTextContent('Dune')
    expect(link).toHaveTextContent('Frank Herbert')
    expect(link).not.toHaveTextContent('Brian Herbert')
    expect(link).toHaveTextContent('Published 1965')
  })

  it('should leave out the publication line for a book with no year', () => {
    renderCard({ ...catalogCard, firstPublishYear: null })

    const link = screen.getByRole('link')
    expect(link).toHaveTextContent('Dune')
    expect(link).not.toHaveTextContent('Published')
  })
})
