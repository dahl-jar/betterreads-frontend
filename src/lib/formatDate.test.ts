import { describe, expect, it } from 'vitest'

import { formatDate } from './formatDate'

describe('formatDate', () => {
  it("should format a date in the reader's locale", () => {
    const value = '2026-06-01'
    const expected = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(new Date(value))

    expect(formatDate(value)).toBe(expected)
  })
})
