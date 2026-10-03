import { describe, expect, it } from 'vitest'

import { formatAuthors, joinAuthors } from './formatAuthors'

const FOUR_AUTHORS = ['Pierce Brown', 'Christopher Ruocchio', 'Third Author', 'Fourth Author']
const THREE_AUTHORS = FOUR_AUTHORS.slice(0, 3)

describe('formatAuthors', () => {
  it.each([
    { authors: THREE_AUTHORS, text: 'Pierce Brown, Christopher Ruocchio, Third Author' },
    { authors: [], text: 'Author unknown' },
  ])('should format $authors.length authors as "$text"', ({ authors, text }) => {
    expect(formatAuthors(authors)).toBe(text)
  })
})

describe('joinAuthors', () => {
  it('should name every author', () => {
    expect(joinAuthors(FOUR_AUTHORS)).toBe(
      'Pierce Brown, Christopher Ruocchio, Third Author, Fourth Author',
    )
  })
})
