import { useCallback } from 'react'

import { type CreateCommentInput } from '../api/commentSchemas'
import { getBookComments } from '../api/getBookComments'
import { postBookComment } from '../api/postBookComment'

import { useCommentThread, type WritableCommentThread } from './useCommentThread'

export type { CommentsStatus, WritableCommentThread } from './useCommentThread'

export function useBookComments(bookKey: string, pageSize = 20): WritableCommentThread {
  const fetchPage = useCallback(
    (offset: number, limit: number) => getBookComments(bookKey, offset, limit),
    [bookKey],
  )
  const [thread, prepend] = useCommentThread(fetchPage, pageSize)
  const post = useCallback(
    async (input: CreateCommentInput) => {
      prepend(await postBookComment(bookKey, input))
    },
    [bookKey, prepend],
  )
  return { ...thread, post }
}
