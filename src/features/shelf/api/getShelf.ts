import { apiGet } from '@/lib/api/client'

import { type ShelfEntry, shelfSchema } from './shelfSchemas'

export async function getShelf(signal?: AbortSignal): Promise<ShelfEntry[]> {
  const raw = await apiGet('/api/v1/me/books', signal ? { signal } : {})
  return shelfSchema.parse(raw)
}
