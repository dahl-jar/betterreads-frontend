import { apiGetPaged } from '@/lib/api/client'

import { type CommentPage, commentsSchema } from './commentSchemas'

export async function getCommentPage(
  path: string,
  offset: number,
  limit: number,
  signal?: AbortSignal,
): Promise<CommentPage> {
  const query = new URLSearchParams({ offset: String(offset), limit: String(limit) })
  const page = await apiGetPaged(`${path}?${query.toString()}`, signal ? { signal } : {})
  return {
    comments: commentsSchema.parse(page.data),
    total: page.meta.total,
    offset: page.meta.offset,
    limit: page.meta.limit,
  }
}
