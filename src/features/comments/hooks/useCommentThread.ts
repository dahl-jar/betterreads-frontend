import { useCallback, useState } from 'react'

import { type Comment, type CommentPage, type CreateCommentInput } from '../api/commentSchemas'

export type CommentsStatus = 'idle' | 'loading' | 'success' | 'error'

export type CommentThread = {
  status: CommentsStatus
  comments: Comment[]
  total: number
  hasMore: boolean
  load: () => Promise<void>
  loadMore: () => Promise<void>
}

export type WritableCommentThread = CommentThread & {
  post: (input: CreateCommentInput) => Promise<void>
}

type FetchPage = (offset: number, limit: number) => Promise<CommentPage>
type PrependComment = (comment: Comment) => void

/** Merges pages without dropping or duplicating comments posted during the request. */
function mergePage(current: Comment[], fetched: Comment[], offset: number): Comment[] {
  if (offset > 0) {
    const seen = new Set(current.map((comment) => comment.id))
    return [...current, ...fetched.filter((comment) => !seen.has(comment.id))]
  }
  const fetchedIds = new Set(fetched.map((comment) => comment.id))
  const localOnly = current.filter((comment) => !fetchedIds.has(comment.id))
  return [...localOnly, ...fetched]
}

export function useCommentThread(
  fetchPage: FetchPage,
  pageSize = 20,
): readonly [CommentThread, PrependComment] {
  const [status, setStatus] = useState<CommentsStatus>('idle')
  const [comments, setComments] = useState<Comment[]>([])
  const [total, setTotal] = useState(0)

  const loadPage = useCallback(
    async (offset: number) => {
      setStatus('loading')
      try {
        const page = await fetchPage(offset, pageSize)
        setComments((current) => mergePage(current, page.comments, offset))
        setTotal(page.total)
        setStatus('success')
      } catch {
        setStatus('error')
      }
    },
    [fetchPage, pageSize],
  )

  const load = useCallback(async () => {
    if (status === 'idle' || status === 'error') {
      await loadPage(0)
    }
  }, [status, loadPage])

  const loadMore = useCallback(() => loadPage(comments.length), [loadPage, comments.length])

  const prepend = useCallback((comment: Comment) => {
    setComments((current) => [comment, ...current])
    setTotal((current) => current + 1)
  }, [])

  const hasMore = comments.length < total

  return [{ status, comments, total, hasMore, load, loadMore }, prepend]
}
