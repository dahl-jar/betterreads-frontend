import { describe, expect, it } from 'vitest'

import shelfEntry from '@/testing/mocks/shelf-entry.json'

import { type ShelfEntry } from '../api/shelfSchemas'
import { matchesQuery, matchRanges } from '../utils/shelfSearch'

const DUNE = shelfEntry as ShelfEntry

describe('matchesQuery', () => {
  it('should match a book when every word appears in its title or authors', () => {
    const matched = matchesQuery(DUNE, 'herbert dune')

    expect(matched).toBe(true)
  })

  it('should match "García" when searching "GARCIA"', () => {
    const matched = matchesQuery({ ...DUNE, authors: ['Gabriel García Márquez'] }, 'GARCIA')

    expect(matched).toBe(true)
  })

  it('should not match when one word is missing', () => {
    const matched = matchesQuery(DUNE, 'dune messiah')

    expect(matched).toBe(false)
  })
})

describe('matchRanges', () => {
  it.each([
    ['"Márquez" for "marquez"', 'Gabriel García Márquez', 'marquez', [[15, 22]]],
    [
      'both words typed in another order',
      'Red Rising',
      'rising red',
      [
        [0, 3],
        [4, 10],
      ],
    ],
    ['overlapping words once', 'Red Rising', 'red re', [[0, 3]]],
    [
      'every place a word appears',
      'Red Rising',
      'r',
      [
        [0, 1],
        [4, 5],
      ],
    ],
  ])('should mark %s', (_case, text, query, ranges) => {
    const marked = matchRanges(text, query)

    expect(marked).toEqual(ranges)
  })
})
