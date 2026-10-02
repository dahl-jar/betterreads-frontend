import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import searchHit from '@/testing/mocks/search-hit.json'
import { render, screen } from '@/testing/test-utils'

import type { BookSearchDocument } from '../api/searchBooks'
import { SearchResults } from '../components/SearchResults'

function renderResults(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

const dune = { ...searchHit, popularityScore: 9 } as BookSearchDocument

const RED_RISING_SAGA = 'Red Rising Saga'
const IRON_GOLD_TRILOGY = 'Iron Gold Trilogy'
const SUN_EATER = 'The Sun Eater'

const redRising: BookSearchDocument = {
  ...searchHit,
  bookId: 'OL2W',
  title: 'Red Rising',
  authors: ['Pierce Brown'],
  seriesName: RED_RISING_SAGA,
  seriesPosition: 1,
  series: [{ name: RED_RISING_SAGA, position: 1 }],
}
const goldenSon: BookSearchDocument = {
  ...redRising,
  bookId: 'OL3W',
  title: 'Golden Son',
  seriesPosition: 2,
  series: [{ name: RED_RISING_SAGA, position: 2 }],
}
const empireOfSilence: BookSearchDocument = {
  ...searchHit,
  bookId: 'OL4W',
  title: 'Empire of Silence',
  authors: ['Christopher Ruocchio'],
  seriesName: SUN_EATER,
  seriesPosition: 1,
  series: [{ name: SUN_EATER, position: 1 }],
}

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
    expect(screen.getByText(/aren't in our sources/)).toBeInTheDocument()
  })

  it('should announce the loading skeleton while results load', () => {
    renderResults(<SearchResults status="loading" hits={[]} query="dune" />)

    expect(screen.getByRole('status', { name: /loading.*results/i })).toBeInTheDocument()
  })

  it('should show a retry affordance when the search failed', () => {
    renderResults(<SearchResults status="error" hits={[]} query="dune" />)

    expect(
      screen.getByText('Something went wrong searching. Try again in a moment.'),
    ).toBeInTheDocument()
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

  it('should show three of four authors followed by an ellipsis', () => {
    const anthology: BookSearchDocument = {
      ...dune,
      authors: ['Pierce Brown', 'Christopher Ruocchio', 'Darrow of Lykos', 'Hadrian Marlowe'],
    }
    renderResults(<SearchResults status="success" hits={[anthology]} query="dune" />)

    const row = screen.getByRole('link', { name: /dune/i })
    expect(row).toHaveTextContent('Pierce Brown, Christopher Ruocchio, Darrow of Lykos …')
    expect(row).not.toHaveTextContent('Hadrian Marlowe')
  })

  it('should show the publication year on a row', () => {
    renderResults(<SearchResults status="success" hits={[dune]} query="dune" />)

    const row = screen.getByRole('link', { name: /dune/i })
    expect(row).toHaveTextContent('1965')
  })

  it('should capitalize the first letter of each genre', () => {
    const lowercased: BookSearchDocument = {
      ...dune,
      subjects: ['science fiction', 'YA'],
    }
    renderResults(<SearchResults status="success" hits={[lowercased]} query="dune" />)

    expect(screen.getByText('Science fiction')).toBeInTheDocument()
    expect(screen.getByText('YA')).toBeInTheDocument()
  })

  it('should show no more than four genres', () => {
    const fiveGenres: BookSearchDocument = {
      ...dune,
      subjects: ['Science fiction', 'Space opera', 'Dystopia', 'Adventure', 'War'],
    }
    renderResults(<SearchResults status="success" hits={[fiveGenres]} query="dune" />)

    expect(screen.getByText('Adventure')).toBeInTheDocument()
    expect(screen.queryByText('War')).not.toBeInTheDocument()
  })

  it('should count the results of each series beside its heading', () => {
    renderResults(
      <SearchResults
        status="success"
        hits={[redRising, goldenSon, empireOfSilence]}
        query="brown"
      />,
    )

    expect(screen.getByRole('heading', { level: 3, name: /Red Rising Saga/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /The Sun Eater/ })).toBeInTheDocument()
    expect(screen.getByText(/\b2 books\b/)).toBeInTheDocument()
    expect(screen.getByText(/\b1 book\b/)).toBeInTheDocument()
  })

  it('should show a two-series book at its position in each series', () => {
    const ironGold: BookSearchDocument = {
      ...redRising,
      bookId: 'OL5W',
      title: 'Iron Gold',
      seriesPosition: 4,
      series: [
        { name: RED_RISING_SAGA, position: 4 },
        { name: IRON_GOLD_TRILOGY, position: 1 },
      ],
    }
    renderResults(<SearchResults status="success" hits={[ironGold]} query="iron gold" />)

    const rows = screen.getAllByRole('link', { name: /Iron Gold/ })
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent(/\bBook 4\b/)
    expect(rows[1]).toHaveTextContent(/\bBook 1\b/)
  })

  it('should show no position for a series book without one', () => {
    const sonsOfAres: BookSearchDocument = {
      ...redRising,
      bookId: 'OL6W',
      title: 'Sons of Ares',
      seriesPosition: null,
      series: [],
    }
    renderResults(
      <SearchResults status="success" hits={[goldenSon, sonsOfAres]} query="red rising" />,
    )

    expect(screen.getByRole('link', { name: /Golden Son/ })).toHaveTextContent(/\bBook 2\b/)
    expect(screen.getByRole('link', { name: /Sons of Ares/ })).not.toHaveTextContent(/\bBook\b/)
  })

  it('should render nothing while idle', () => {
    const { container } = renderResults(<SearchResults status="idle" hits={[]} query="" />)

    expect(container).toBeEmptyDOMElement()
  })
})
