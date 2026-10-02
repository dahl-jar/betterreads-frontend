import { describe, expect, it } from 'vitest'

import { initialOf } from './initialOf'

describe('initialOf', () => {
  it.each([
    { text: 'dune', initial: 'D' },
    { text: '  mustang', initial: 'M' },
    { text: '[deleted]', initial: 'D' },
    { text: '1984', initial: '1' },
    { text: '', initial: '?' },
    { text: '...', initial: '?' },
  ])('should show "$initial" for "$text"', ({ text, initial }) => {
    expect(initialOf(text)).toBe(initial)
  })
})
