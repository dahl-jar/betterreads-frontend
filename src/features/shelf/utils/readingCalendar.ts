import { type ShelfEntry } from '../api/shelfSchemas'

import { SHELF_SORTS } from './shelfSorts'

type YearDay = {
  date: string
  week: number
  weekday: number
}

type YearGrid = {
  weeks: number
  days: YearDay[]
}

const DAYS_PER_WEEK = 7
const MS_PER_DAY = 86_400_000
const ISO_DATE_LENGTH = 10
const YEAR_LENGTH = 4
const KNOWN_MONDAY = Date.UTC(2024, 0, 1)

export const MONTH_PERIOD_LENGTH = 7

const HEAT_TONES = ['bg-sunken', 'bg-brand/55', 'bg-brand/80', 'bg-brand'] as const

const WEEKDAY_NAME = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })

export const WEEKDAYS = Array.from({ length: DAYS_PER_WEEK }, (_, index) =>
  WEEKDAY_NAME.format(new Date(KNOWN_MONDAY + index * MS_PER_DAY)),
)

function isoDay(date: Date): string {
  return date.toISOString().slice(0, ISO_DATE_LENGTH)
}

function mondayIndex(date: Date): number {
  return (date.getUTCDay() + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK
}

function isFinishedIn(entry: ShelfEntry, period: string): boolean {
  return entry.status === 'FINISHED' && (entry.finishedAt ?? '').startsWith(period)
}

export function yearOf(period: string): string {
  return period.slice(0, YEAR_LENGTH)
}

export function monthParts(period: string): { year: number; month: number } {
  const [year = 0, month = 1] = period.split('-').map(Number)
  return { year, month }
}

export function finishedByDay(entries: ShelfEntry[], year: number): Record<string, ShelfEntry[]> {
  return entries
    .filter((entry) => isFinishedIn(entry, String(year)))
    .reduce<Record<string, ShelfEntry[]>>((byDay, entry) => {
      const day = entry.finishedAt ?? ''
      return { ...byDay, [day]: [...(byDay[day] ?? []), entry] }
    }, {})
}

export function monthGrid(year: number, month: number): (string | undefined)[] {
  const first = new Date(Date.UTC(year, month - 1, 1))
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const blanks = Array.from({ length: mondayIndex(first) }, () => undefined)
  const dates = Array.from({ length: days }, (_, index) =>
    isoDay(new Date(first.getTime() + index * MS_PER_DAY)),
  )
  return [...blanks, ...dates]
}

export function yearGrid(year: number): YearGrid {
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year + 1, 0, 1))
  const offset = mondayIndex(start)
  const length = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY)
  const days = Array.from({ length }, (_, index) => {
    const cell = index + offset
    return {
      date: isoDay(new Date(start.getTime() + index * MS_PER_DAY)),
      week: Math.floor(cell / DAYS_PER_WEEK),
      weekday: cell % DAYS_PER_WEEK,
    }
  })
  return { weeks: Math.ceil((length + offset) / DAYS_PER_WEEK), days }
}

export function heatTone(count: number): string {
  return HEAT_TONES[Math.min(count, HEAT_TONES.length - 1)] ?? HEAT_TONES[0]
}

export function finishedIn(entries: ShelfEntry[], period: string): ShelfEntry[] {
  const yearly = period.length < MONTH_PERIOD_LENGTH
  return entries
    .filter((entry) => isFinishedIn(entry, period))
    .sort((first, second) =>
      yearly ? SHELF_SORTS.read.compare(first, second) : SHELF_SORTS.read.compare(second, first),
    )
}

export function shiftMonth(period: string, step: number): string {
  const { year, month } = monthParts(period)
  const shifted = new Date(Date.UTC(year, month - 1 + step, 1))
  return isoDay(shifted).slice(0, MONTH_PERIOD_LENGTH)
}
