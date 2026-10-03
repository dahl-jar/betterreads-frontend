import { apiPut } from '@/lib/api/client'

import { notifyShelfChanged } from './shelfChanges'
import { type ShelfEntry, shelfEntrySchema } from './shelfSchemas'

export async function changeFavorite(key: string, favorite: boolean): Promise<ShelfEntry> {
  const raw = await apiPut(`/api/v1/me/books/${encodeURIComponent(key)}/favorite`, { favorite })
  const entry = shelfEntrySchema.parse(raw)
  notifyShelfChanged()
  return entry
}
