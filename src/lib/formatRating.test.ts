import { describe, expect, it } from 'vitest'

import { formatRating } from './formatRating'

describe('formatRating', () => {
  it.each([
    { value: 3, text: '3' },
    { value: 4.5, text: '4.5' },
    { value: 4.71, text: '4.71' },
    { value: 4.706, text: '4.71' },
  ])('should format $value as "$text"', ({ value, text }) => {
    expect(formatRating(value)).toBe(text)
  })
})
