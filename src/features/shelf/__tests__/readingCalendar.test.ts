import { describe, expect, it } from 'vitest'

import { DARK_AGE, GOLDEN_SON, IRON_GOLD, MORNING_STAR, RED_RISING } from '@/testing/readingHistory'

import {
  finishedByDay,
  finishedIn,
  heatTone,
  monthGrid,
  WEEKDAYS,
  yearGrid,
} from '../utils/readingCalendar'

const YEAR = 2026
const OCTOBER = 10
const DAYS_IN_OCTOBER = 31
const BLANKS_BEFORE_OCTOBER_FIRST = 3
const THURSDAY = 3
const FIRST_MONDAY_INDEX = 4
const WEEKS_IN_2026 = 53
const SUNDAY = 6
const LEAP_YEAR_FROM_SUNDAY = 2012
const WEEKS_IN_2012 = 54
const DARKEST_TONE_COUNT = 3
const BUSY_DAY_COUNT = 5

describe('readingCalendar', () => {
  it('should start a month on Monday', () => {
    const cells = monthGrid(YEAR, OCTOBER)

    expect(cells.slice(0, BLANKS_BEFORE_OCTOBER_FIRST + 1)).toEqual([
      undefined,
      undefined,
      undefined,
      '2026-10-01',
    ])
    expect(cells).toHaveLength(BLANKS_BEFORE_OCTOBER_FIRST + DAYS_IN_OCTOBER)
  })

  it('should group two books finished the same day', () => {
    const sameDay = { ...GOLDEN_SON, finishedAt: RED_RISING.finishedAt }

    const byDay = finishedByDay([RED_RISING, sameDay, MORNING_STAR], YEAR)

    expect(byDay[RED_RISING.finishedAt]?.map((entry) => entry.title)).toEqual([
      'Red Rising',
      'Golden Son',
    ])
  })

  it.each([
    ['a month oldest first', '2026-06', ['Red Rising', 'Golden Son']],
    ['a year newest first', '2026', ['Golden Son', 'Red Rising', 'Morning Star']],
  ])('should list %s', (_order, period, titles) => {
    const shelf = [MORNING_STAR, GOLDEN_SON, IRON_GOLD, RED_RISING, DARK_AGE]

    const listed = finishedIn(shelf, period)

    expect(listed.map((entry) => entry.title)).toEqual(titles)
  })

  it('should leave out books finished in another year', () => {
    const shelf = [RED_RISING, IRON_GOLD, DARK_AGE]

    const byDay = finishedByDay(shelf, YEAR)

    expect(Object.keys(byDay)).toEqual([RED_RISING.finishedAt])
  })

  it('should leave out a dated book that is no longer on the Read shelf', () => {
    const reread = { ...GOLDEN_SON, status: 'CURRENTLY_READING' as const }

    const listed = finishedIn([RED_RISING, reread], '2026-06')

    expect(listed.map((entry) => entry.title)).toEqual(['Red Rising'])
  })

  it('should put the first day of the year on its weekday row', () => {
    const { days } = yearGrid(YEAR)

    expect(days[0]).toEqual({ date: '2026-01-01', week: 0, weekday: THURSDAY })
  })

  it('should start the second week on the first Monday', () => {
    const { days } = yearGrid(YEAR)

    expect(days[FIRST_MONDAY_INDEX - 1]).toEqual({ date: '2026-01-04', week: 0, weekday: SUNDAY })
    expect(days[FIRST_MONDAY_INDEX]).toEqual({ date: '2026-01-05', week: 1, weekday: 0 })
  })

  it('should give 2026 fifty-three week columns', () => {
    expect(yearGrid(YEAR).weeks).toBe(WEEKS_IN_2026)
  })

  it('should give a leap year that starts on a Sunday fifty-four week columns', () => {
    expect(yearGrid(LEAP_YEAR_FROM_SUNDAY).weeks).toBe(WEEKS_IN_2012)
  })

  it('should name the weekdays from Monday', () => {
    expect(WEEKDAYS).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  })

  it('should keep the darkest tone for days above three books', () => {
    expect(heatTone(BUSY_DAY_COUNT)).toBe(heatTone(DARKEST_TONE_COUNT))
  })

  it('should give zero to three books four different tones', () => {
    const tones = [0, 1, 2, 3].map(heatTone)

    expect(new Set(tones).size).toBe(tones.length)
  })
})
