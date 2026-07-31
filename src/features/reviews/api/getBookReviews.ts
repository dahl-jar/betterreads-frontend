import { getReviewPage } from './getReviewPage'
import { type ReviewPage } from './reviewSchemas'

const DEFAULT_LIMIT = 20

export async function getBookReviews(
  key: string,
  offset = 0,
  limit = DEFAULT_LIMIT,
  signal?: AbortSignal,
): Promise<ReviewPage> {
  return getReviewPage(`/api/v1/books/${encodeURIComponent(key)}/reviews`, offset, limit, signal)
}
