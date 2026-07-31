import { describe, expect, it } from 'vitest'

import { formatShelfDate } from '../utils/formatShelfDate'

describe('formatShelfDate', () => {
  it('should format an ISO date as a short month-day-year', () => {
    expect(formatShelfDate('2026-02-14')).toBe('Feb 14, 2026')
  })

  it('should return undefined without a date', () => {
    expect(formatShelfDate(undefined)).toBeUndefined()
  })
})
