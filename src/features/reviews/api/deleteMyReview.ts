import { apiDelete } from '@/lib/api/client'

export async function deleteMyReview(key: string): Promise<void> {
  await apiDelete(`/api/v1/books/${encodeURIComponent(key)}/reviews/me`)
}
