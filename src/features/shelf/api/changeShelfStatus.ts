import { apiPut } from '@/lib/api/client'

import { type ReadingStatus, type ShelfEntry, shelfEntrySchema } from './shelfSchemas'

export async function changeShelfStatus(key: string, status: ReadingStatus): Promise<ShelfEntry> {
  const raw = await apiPut(`/api/v1/me/books/${encodeURIComponent(key)}/status`, { status })
  return shelfEntrySchema.parse(raw)
}
