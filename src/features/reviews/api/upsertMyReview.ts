import { apiPut } from '@/lib/api/client'

import { type Review, reviewSchema, type UpsertReviewInput } from './reviewSchemas'

export async function upsertMyReview(key: string, input: UpsertReviewInput): Promise<Review> {
  const raw = await apiPut(`/api/v1/books/${encodeURIComponent(key)}/reviews/me`, input)
  return reviewSchema.parse(raw)
}
