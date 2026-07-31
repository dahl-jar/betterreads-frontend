import { useCallback } from 'react'

import { type CreateCommentInput } from '../api/commentSchemas'
import { getReviewComments } from '../api/getReviewComments'
import { postReviewComment } from '../api/postReviewComment'

import { useCommentThread, type WritableCommentThread } from './useCommentThread'

export type { CommentsStatus, WritableCommentThread } from './useCommentThread'

export function useReviewComments(reviewId: number, pageSize = 20): WritableCommentThread {
  const fetchPage = useCallback(
    (offset: number, limit: number) => getReviewComments(reviewId, offset, limit),
    [reviewId],
  )
  const [thread, prepend] = useCommentThread(fetchPage, pageSize)
  const post = useCallback(
    async (input: CreateCommentInput) => {
      prepend(await postReviewComment(reviewId, input))
    },
    [prepend, reviewId],
  )
  return { ...thread, post }
}
