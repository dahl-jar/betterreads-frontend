import { type ShelfEntry } from '../api/shelfSchemas'

export type ShelfSort = 'added' | 'title' | 'rating' | 'read'

type ShelfSortOption = {
  label: string
  compare: (first: ShelfEntry, second: ShelfEntry) => number
}

export const SHELF_SORTS: Record<ShelfSort, ShelfSortOption> = {
  added: {
    label: 'Recently added',
    compare: (first, second) => second.addedAt.localeCompare(first.addedAt),
  },
  title: {
    label: 'Title',
    compare: (first, second) => first.title.localeCompare(second.title),
  },
  rating: {
    label: 'Your rating',
    compare: (first, second) => (second.myRating ?? 0) - (first.myRating ?? 0),
  },
  read: {
    label: 'Date read',
    compare: (first, second) => (second.finishedAt ?? '').localeCompare(first.finishedAt ?? ''),
  },
}
