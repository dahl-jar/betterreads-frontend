import { apiDelete } from '@/lib/api/client'

export async function removeFromShelf(key: string): Promise<void> {
  await apiDelete(`/api/v1/me/books/${encodeURIComponent(key)}`)
}
