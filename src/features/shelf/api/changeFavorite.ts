import { apiPut } from '@/lib/api/client'

import { type ShelfEntry, shelfEntrySchema } from './shelfSchemas'

export async function changeFavorite(key: string, favorite: boolean): Promise<ShelfEntry> {
  const raw = await apiPut(`/api/v1/me/books/${encodeURIComponent(key)}/favorite`, { favorite })
  return shelfEntrySchema.parse(raw)
}
