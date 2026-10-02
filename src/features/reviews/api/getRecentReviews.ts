import { z } from 'zod'

import { apiGet } from '@/lib/api/client'

const RECENT_REVIEWS_PATH = '/api/v1/reviews/recent'

const recentReviewSchema = z.object({
  id: z.number().int(),
  author: z.string(),
  rating: z.number().int().nullish(),
  title: z.string().nullish(),
  body: z.string(),
  createdAt: z.string(),
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
