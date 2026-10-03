import { SHELF_PATH } from '@/lib/shelfPath'

import { type ReadingStatus, readingStatusSchema, type ShelfEntry } from '../api/shelfSchemas'

export type ShelfFilter = 'ALL' | ReadingStatus | 'FAVORITES'

export function matchesFilter(entry: ShelfEntry, filter: ShelfFilter): boolean {
  if (filter === 'ALL') {
    return true
  }
  if (filter === 'FAVORITES') {
    return entry.favorite
  }
  return entry.status === filter
}

export function countFor(entries: ShelfEntry[], filter: ShelfFilter): number {
  return entries.filter((entry) => matchesFilter(entry, filter)).length
}

export function parseShelfFilter(value: string | null): ShelfFilter {
  if (value === 'FAVORITES') {
    return value
  }
  const status = readingStatusSchema.safeParse(value)
  return status.success ? status.data : 'ALL'
}

export const SHELF_PARAM = 'shelf'

export function shelfFilterPath(filter: ShelfFilter): string {
  return `${SHELF_PATH}?${SHELF_PARAM}=${filter}`
}
