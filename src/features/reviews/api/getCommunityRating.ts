import { z } from 'zod'

import { apiGet } from '@/lib/api/client'

const BOOKS_BASE = '/api/v1/books'

const starCountSchema = z.object({
  star: z.number().int(),
  count: z.number().int(),
})

export const communityRatingSchema = z.object({
  average: z.number().nullish(),
  count: z.number().int(),
  distribution: z.array(starCountSchema),
})

export type CommunityRating = z.infer<typeof communityRatingSchema>

export async function getCommunityRating(
  key: string,
  signal?: AbortSignal,
): Promise<CommunityRating> {
  const raw = await apiGet(
    `${BOOKS_BASE}/${encodeURIComponent(key)}/community-rating`,
    signal ? { signal } : {},
  )
  return communityRatingSchema.parse(raw)
}
