import { describe, expect, it } from 'vitest'

import shelfEntry from '@/testing/mocks/shelf-entry.json'

import { type ReadingStatus } from '../api/shelfSchemas'
import { shelfDateLine } from '../utils/shelfDateLine'

const DATED_ENTRY = {
  ...shelfEntry,
  addedAt: '2026-01-05',
  startedAt: '2026-01-20',
  finishedAt: '2026-02-14',
}

describe('shelfDateLine', () => {
  it.each<{ label: string; status: ReadingStatus; verb: string; date: string }>([
    { label: 'Want to read', status: 'WANT_TO_READ', verb: 'Added', date: 'Jan 5, 2026' },
    {
      label: 'Currently reading',
      status: 'CURRENTLY_READING',
      verb: 'Started',
      date: 'Jan 20, 2026',
    },
    { label: 'Read', status: 'FINISHED', verb: 'Read', date: 'Feb 14, 2026' },
    { label: 'Did not finish', status: 'DROPPED', verb: 'Added', date: 'Jan 5, 2026' },
  ])('should date a "$label" book as "$verb $date"', ({ status, verb, date }) => {
    expect(shelfDateLine({ ...DATED_ENTRY, status })).toEqual({ verb, date })
  })
})
