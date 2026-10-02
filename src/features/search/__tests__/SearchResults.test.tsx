import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { render, screen } from '@/testing/test-utils'

import type { BookSearchDocument } from '../api/searchBooks'
import { SearchResults } from '../components/SearchResults'

import searchHit from './mocks/search-hit.json'

function renderResults(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

const dune = { ...searchHit, popularityScore: 9 } as BookSearchDocument

describe('SearchResults', () => {
  it('should render search hits', () => {
    renderResults(<SearchResults status="success" hits={[dune]} query="dune" />)

    const link = screen.getByRole('link', { name: /dune/i })
    expect(link).toHaveAttribute('href', '/books/OL1W')
    expect(screen.getByText(/Frank Herbert/)).toBeInTheDocument()
  })

  it('should render a repeated subject only once', () => {
    const withDupes: BookSearchDocument = {
      ...dune,
      subjects: ['Fiction', 'fiction', 'Science fiction'],
    }
    renderResults(<SearchResults status="success" hits={[withDupes]} query="dune" />)

    expect(screen.getAllByText(/^fiction$/i)).toHaveLength(1)
  })

  it('should explain an empty staged search', () => {
    renderResults(<SearchResults status="staging" hits={[]} query="some obscure title" />)

    expect(screen.getByText(/some obscure title/i)).toBeInTheDocument()
    expect(screen.getByText(/checking our sources/i)).toBeInTheDocument()
    expect(screen.getByText(/aren't in our sources|missing details/i)).toBeInTheDocument()
  })

  it('should announce the loading skeleton while results load', () => {
    renderResults(<SearchResults status="loading" hits={[]} query="dune" />)

    expect(screen.getByRole('status', { name: /loading.*results/i })).toBeInTheDocument()
  })

  it('should show a retry affordance when the search failed', () => {
    renderResults(<SearchResults status="error" hits={[]} query="dune" />)

    expect(screen.getByText(/something went wrong|try again/i)).toBeInTheDocument()
  })

  it('should group books that share a series under one series heading', () => {
    const firstEmpire = {
      ...searchHit,
      bookId: '1',
      title: 'The Final Empire',
      seriesName: 'Mistborn',
      seriesPosition: 1,
      series: [{ name: 'Mistborn', position: 1 }],
      authors: ['Brandon Sanderson'],
      subjects: [],
      publicationYear: 2006,
      popularityScore: 8,
    } as BookSearchDocument
    const wellOfAscension: BookSearchDocument = {
      ...firstEmpire,
      bookId: '2',
      title: 'The Well of Ascension',
      seriesPosition: 2,
      series: [{ name: 'Mistborn', position: 2 }],
      publicationYear: 2007,
    }
    renderResults(
      <SearchResults status="success" hits={[wellOfAscension, firstEmpire]} query="mistborn" />,
    )

    const heading = screen.getByRole('heading', { name: /mistborn/i })
    expect(heading).toBeInTheDocument()
    const titles = screen.getAllByRole('link').map((link) => link.textContent)
    expect(titles[0]).toContain('The Final Empire')
    expect(titles[1]).toContain('The Well of Ascension')
  })

  it('should render a standalone book without a series heading', () => {
    const warbreaker = {
      ...searchHit,
      bookId: 'w',
      title: 'Warbreaker',
      seriesName: null,
      seriesPosition: null,
      series: [],
      authors: ['Brandon Sanderson'],
      subjects: [],
      publicationYear: 2009,
      popularityScore: 7,
    } as BookSearchDocument
    renderResults(<SearchResults status="success" hits={[warbreaker]} query="warbreaker" />)

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /warbreaker/i })).toBeInTheDocument()
  })

  it('should render nothing while idle', () => {
    const { container } = renderResults(<SearchResults status="idle" hits={[]} query="" />)

    expect(container).toBeEmptyDOMElement()
  })
})
