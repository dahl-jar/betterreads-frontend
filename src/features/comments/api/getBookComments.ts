import { type CommentPage } from './commentSchemas'
import { getCommentPage } from './getCommentPage'

const DEFAULT_LIMIT = 20

export function getBookComments(
  key: string,
  offset = 0,
  limit = DEFAULT_LIMIT,
  signal?: AbortSignal,
): Promise<CommentPage> {
  return getCommentPage(`/api/v1/books/${encodeURIComponent(key)}/comments`, offset, limit, signal)
}
