import { apiPut } from '@/lib/api/client'

export async function rateBook(key: string, rating: number): Promise<void> {
  await apiPut(`/api/v1/books/${encodeURIComponent(key)}/reviews/me/rating`, { rating })
}
