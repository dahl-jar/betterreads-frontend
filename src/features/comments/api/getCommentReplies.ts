import { type CommentPage } from './commentSchemas'
import { getCommentPage } from './getCommentPage'

const DEFAULT_LIMIT = 20

export function getCommentReplies(
  commentId: number,
  offset = 0,
  limit = DEFAULT_LIMIT,
  signal?: AbortSignal,
): Promise<CommentPage> {
  return getCommentPage(`/api/v1/comments/${commentId}/replies`, offset, limit, signal)
}
