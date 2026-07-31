import { postReviewComment } from '../api/postReviewComment'
import { useReviewComments } from '../hooks/useReviewComments'

import { CommentThreadView } from './CommentThreadView'

type ReviewCommentsProps = {
  reviewId: number
  commentCount?: number
  pageSize?: number
}

export function ReviewComments({ reviewId, commentCount, pageSize = 20 }: ReviewCommentsProps) {
  const thread = useReviewComments(reviewId, pageSize)
  return (
    <CommentThreadView
      thread={thread}
      commentCount={commentCount}
      postReply={(parentCommentId, body) =>
        postReviewComment(reviewId, { body, parentCommentId }).then(() => undefined)
      }
    />
  )
}
