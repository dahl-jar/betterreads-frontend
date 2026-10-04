import { reviewCommentDraftKey } from '@/lib/draftKeys'

import { postReviewComment } from '../api/postReviewComment'
import { useReviewComments } from '../hooks/useReviewComments'

import { CommentThreadView } from './CommentThreadView'

const PAGE_SIZE = 20

export function ReviewComments({ reviewId }: { reviewId: number }) {
  const thread = useReviewComments(reviewId, PAGE_SIZE)
  return (
    <CommentThreadView
      thread={thread}
      draftKey={reviewCommentDraftKey(reviewId)}
      pinComposer
      postReply={(parentCommentId, body) =>
        postReviewComment(reviewId, { body, parentCommentId }).then(() => undefined)
      }
    />
  )
}
