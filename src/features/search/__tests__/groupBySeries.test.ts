import { describe, expect, it } from 'vitest'

import type { BookSearchDocument } from '../api/searchBooks'
import { groupBySeries } from '../lib/groupBySeries'

import { makeSearchHit } from './mocks/searchHit'

function book(overrides: Partial<BookSearchDocument>): BookSearchDocument {
  return makeSearchHit({
    bookId: 'id',
    title: 'A Book',
    seriesName: null,
    seriesPosition: null,
    publicationYear: null,
    ...overrides,
  })
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
})
