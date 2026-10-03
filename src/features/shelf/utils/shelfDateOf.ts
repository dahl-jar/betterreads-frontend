import { type ReadingStatus, type ShelfEntry } from '../api/shelfSchemas'

import { formatShelfDate } from './formatShelfDate'

const SHELF_DATES: Record<ReadingStatus, (entry: ShelfEntry) => string | null | undefined> = {
  WANT_TO_READ: (entry) => entry.addedAt,
  CURRENTLY_READING: (entry) => entry.startedAt,
  FINISHED: (entry) => entry.finishedAt,
  DROPPED: (entry) => entry.addedAt,
}

export function shelfDateOf(entry: ShelfEntry): string | undefined {
  return formatShelfDate(SHELF_DATES[entry.status](entry))
}
