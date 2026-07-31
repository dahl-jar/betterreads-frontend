import { useCallback } from 'react'

import { getCommentReplies } from '../api/getCommentReplies'

import { useCommentThread, type CommentThread } from './useCommentThread'

export type { CommentThread } from './useCommentThread'

export function useCommentReplies(commentId: number, pageSize = 20): CommentThread {
  const fetchPage = useCallback(
    (offset: number, limit: number) => getCommentReplies(commentId, offset, limit),
    [commentId],
  )
  const [thread] = useCommentThread(fetchPage, pageSize)
  return thread
}
