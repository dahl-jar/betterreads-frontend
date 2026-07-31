import { apiPost } from '@/lib/api/client'

import { type Comment, commentSchema, type CreateCommentInput } from './commentSchemas'

export async function postBookComment(key: string, input: CreateCommentInput): Promise<Comment> {
  const raw = await apiPost(`/api/v1/books/${encodeURIComponent(key)}/comments`, input)
  return commentSchema.parse(raw)
}
