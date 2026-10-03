import { type ReadingStatus, type ShelfEntry } from '../api/shelfSchemas'

import { shelfDateOf } from './shelfDateOf'

type ShelfDateLine = {
  verb: string
  date: string | undefined
}

const DATE_VERBS: Record<ReadingStatus, string> = {
  WANT_TO_READ: 'Added',
  CURRENTLY_READING: 'Started',
  FINISHED: 'Read',
  DROPPED: 'Added',
}

export function shelfDateLine(entry: ShelfEntry): ShelfDateLine {
  return { verb: DATE_VERBS[entry.status], date: shelfDateOf(entry) }
}
