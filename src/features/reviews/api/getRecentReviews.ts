import { z } from 'zod'

import { apiGet } from '@/lib/api/client'

import { reviewSchema } from './reviewSchemas'

const RECENT_REVIEWS_PATH = '/api/v1/reviews/recent'

const recentReviewSchema = reviewSchema.omit({ bookKey: true }).extend({
  body: z.string(),
  book: z.object({
    key: z.string(),
    title: z.string(),
    authors: z.array(z.string()),
    coverUrl: z.string().nullish(),
  }),
})

export type RecentReview = z.infer<typeof recentReviewSchema>

const recentReviewsSchema = z.array(recentReviewSchema)

export async function getRecentReviews(
  limit: number,
  signal?: AbortSignal,
): Promise<RecentReview[]> {
  const search = new URLSearchParams({ limit: String(limit) })
  const raw = await apiGet(`${RECENT_REVIEWS_PATH}?${search.toString()}`, signal ? { signal } : {})
  return recentReviewsSchema.parse(raw)
}
