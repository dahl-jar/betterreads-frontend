import { apiPost } from '@/lib/api/client'

import { type Comment, commentSchema, type CreateCommentInput } from './commentSchemas'

export async function postReviewComment(
  reviewId: number,
  input: CreateCommentInput,
): Promise<Comment> {
  const raw = await apiPost(`/api/v1/reviews/${reviewId}/comments`, input)
  return commentSchema.parse(raw)
}
