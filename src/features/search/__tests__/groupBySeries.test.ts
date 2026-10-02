import { describe, expect, it } from 'vitest'

import searchHit from '@/testing/mocks/search-hit.json'

import type { BookSearchDocument } from '../api/searchBooks'
import { groupBySeries } from '../lib/groupBySeries'

function book(overrides: Partial<BookSearchDocument>): BookSearchDocument {
  return {
    ...searchHit,
    seriesName: null,
    seriesPosition: null,
    series: [],
    ...overrides,
  }
}

describe('groupBySeries', () => {
  it('should keep a standalone book as its own ungrouped entry', () => {
    const warbreaker = book({ bookId: 'w', title: 'Warbreaker' })

    const groups = groupBySeries([warbreaker])

    expect(groups).toEqual([{ kind: 'book', book: warbreaker }])
  })

  it('should collect books that share a series name under one group', () => {
    const first = book({ bookId: '1', title: 'The Final Empire', seriesName: 'Mistborn' })
    const second = book({ bookId: '2', title: 'The Well of Ascension', seriesName: 'Mistborn' })

    const groups = groupBySeries([first, second])

    expect(groups).toEqual([{ kind: 'series', seriesName: 'Mistborn', books: [first, second] }])
  })

  it('should order books within a series by seriesPosition when present', () => {
    const third = book({
      bookId: '3',
      title: 'Hero of Ages',
      seriesName: 'Mistborn',
      seriesPosition: 3,
    })
    const first = book({
      bookId: '1',
      title: 'Final Empire',
      seriesName: 'Mistborn',
      seriesPosition: 1,
    })
    const second = book({
      bookId: '2',
      title: 'Well of Ascension',
      seriesName: 'Mistborn',
      seriesPosition: 2,
    })

    const groups = groupBySeries([third, first, second])

    expect(groups).toEqual([
      {
        kind: 'series',
        seriesName: 'Mistborn',
        books: [first, second, third],
      },
    ])
  })

  it('should sort unpositioned series books by year', () => {
    const newer = book({ bookId: 'n', title: 'Sequel', seriesName: 'Saga', publicationYear: 2008 })
    const older = book({
      bookId: 'o',
      title: 'Original',
      seriesName: 'Saga',
      publicationYear: 2005,
    })

    const groups = groupBySeries([newer, older])

    expect(groups).toEqual([
      {
        kind: 'series',
        seriesName: 'Saga',
        books: [older, newer],
      },
    ])
  })

  it('should sort positioned books ahead of those missing a position', () => {
    const positioned = book({
      bookId: 'p',
      title: 'Book One',
      seriesName: 'Saga',
      seriesPosition: 1,
    })
    const unpositioned = book({ bookId: 'u', title: 'Companion', seriesName: 'Saga' })

    const groups = groupBySeries([unpositioned, positioned])

    expect(groups).toEqual([
      {
        kind: 'series',
        seriesName: 'Saga',
        books: [positioned, unpositioned],
      },
    ])
  })

  it('should sort an older unpositioned book after positioned ones', () => {
    const positioned = book({
      bookId: 'p',
      title: 'Book One',
      seriesName: 'Saga',
      seriesPosition: 1,
      publicationYear: 2010,
    })
    const companion = book({
      bookId: 'c',
      title: 'Companion',
      seriesName: 'Saga',
      publicationYear: 2000,
    })

    const groups = groupBySeries([positioned, companion])

    expect(groups).toEqual([{ kind: 'series', seriesName: 'Saga', books: [positioned, companion] }])
  })

  it('should preserve relevance order across result groups', () => {
    const standalone = book({ bookId: 's', title: 'Elantris' })
    const seriesA = book({ bookId: 'a', title: 'Book A', seriesName: 'Stormlight' })
    const seriesB = book({ bookId: 'b', title: 'Book B', seriesName: 'Stormlight' })

    const groups = groupBySeries([seriesA, standalone, seriesB])

    expect(groups).toEqual([
      { kind: 'series', seriesName: 'Stormlight', books: [seriesA, seriesB] },
      { kind: 'book', book: standalone },
    ])
  })

  it('should keep a one-book series grouped', () => {
    const lone = book({ bookId: 'l', title: 'Only One', seriesName: 'Trilogy' })

    const groups = groupBySeries([lone])

    expect(groups).toEqual([{ kind: 'series', seriesName: 'Trilogy', books: [lone] }])
  })

  it('should put a book in every series group', () => {
    const wordsOfRadiance = book({
      bookId: 'wor',
      title: 'Words of Radiance',
      series: [
        { name: 'The Stormlight Archive', position: 2 },
        { name: 'The Cosmere', position: 12 },
      ],
    })

    const groups = groupBySeries([wordsOfRadiance])

    expect(groups).toEqual([
      { kind: 'series', seriesName: 'The Stormlight Archive', books: [wordsOfRadiance] },
      { kind: 'series', seriesName: 'The Cosmere', books: [wordsOfRadiance] },
    ])
  })

  it('should order each group by its own series position', () => {
    const wordsOfRadiance = book({
      bookId: 'wor',
      title: 'Words of Radiance',
      seriesName: 'The Stormlight Archive',
      seriesPosition: 2,
      series: [
        { name: 'The Stormlight Archive', position: 2 },
        { name: 'The Cosmere', position: 12 },
      ],
    })
    const warbreaker = book({
      bookId: 'w',
      title: 'Warbreaker',
      seriesName: 'The Cosmere',
      seriesPosition: 7,
      series: [{ name: 'The Cosmere', position: 7 }],
    })

    const groups = groupBySeries([wordsOfRadiance, warbreaker])

    expect(groups).toEqual([
      { kind: 'series', seriesName: 'The Stormlight Archive', books: [wordsOfRadiance] },
      { kind: 'series', seriesName: 'The Cosmere', books: [warbreaker, wordsOfRadiance] },
    ])
  })
})
