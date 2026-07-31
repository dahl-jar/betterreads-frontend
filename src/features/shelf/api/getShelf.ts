import { apiGet } from '@/lib/api/client'

import { type ReadingStatus, type ShelfEntry, shelfSchema } from './shelfSchemas'

export async function getShelf(
  status?: ReadingStatus,
  signal?: AbortSignal,
): Promise<ShelfEntry[]> {
  const query = status ? `?status=${status}` : ''
  const raw = await apiGet(`/api/v1/me/books${query}`, signal ? { signal } : {})
  return shelfSchema.parse(raw)
}
