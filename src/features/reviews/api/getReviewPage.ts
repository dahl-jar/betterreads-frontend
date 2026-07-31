import { apiGetPaged } from '@/lib/api/client'

import { type ReviewPage, reviewsSchema } from './reviewSchemas'

export async function getReviewPage(
  path: string,
  offset: number,
  limit: number,
  signal?: AbortSignal,
): Promise<ReviewPage> {
  const query = new URLSearchParams({ offset: String(offset), limit: String(limit) })
  const page = await apiGetPaged(`${path}?${query.toString()}`, signal ? { signal } : {})
  return {
    reviews: reviewsSchema.parse(page.data),
    total: page.meta.total,
    offset: page.meta.offset,
    limit: page.meta.limit,
  }
}
