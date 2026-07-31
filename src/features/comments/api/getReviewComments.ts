import { type CommentPage } from './commentSchemas'
import { getCommentPage } from './getCommentPage'

const DEFAULT_LIMIT = 20

export function getReviewComments(
  reviewId: number,
  offset = 0,
  limit = DEFAULT_LIMIT,
  signal?: AbortSignal,
): Promise<CommentPage> {
  return getCommentPage(`/api/v1/reviews/${reviewId}/comments`, offset, limit, signal)
}
