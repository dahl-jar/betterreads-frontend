import { z } from 'zod'

import { apiGet } from '@/lib/api/client'

const BOOKS_BASE = '/api/v1/books'

const shelfCountsSchema = z.object({
  wantToRead: z.number().int(),
  currentlyReading: z.number().int(),
  finished: z.number().int(),
  dropped: z.number().int(),
})

export type ShelfCounts = z.infer<typeof shelfCountsSchema>

export async function getShelfCounts(key: string, signal?: AbortSignal): Promise<ShelfCounts> {
  const raw = await apiGet(
    `${BOOKS_BASE}/${encodeURIComponent(key)}/shelf-counts`,
    signal ? { signal } : {},
  )
  return shelfCountsSchema.parse(raw)
}
