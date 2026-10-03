import { apiDelete } from '@/lib/api/client'

import { notifyShelfChanged } from './shelfChanges'

export async function removeFromShelf(key: string): Promise<void> {
  await apiDelete(`/api/v1/me/books/${encodeURIComponent(key)}`)
  notifyShelfChanged()
}
