import { postBookComment } from '../api/postBookComment'
import { useBookComments } from '../hooks/useBookComments'

import { CommentThreadView } from './CommentThreadView'

const DISCUSSION_PAGE_SIZE = 5

type BookCommentsProps = {
  bookKey: string
  pageSize?: number
}

export function BookComments({ bookKey, pageSize = DISCUSSION_PAGE_SIZE }: BookCommentsProps) {
  const thread = useBookComments(bookKey, pageSize)
  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl font-semibold text-ink">Discussion</h2>
      <p className="mt-1 text-sm text-ink-soft">Talk about this book with other readers.</p>
      <CommentThreadView
        thread={thread}
        alwaysOpen
        postReply={(parentCommentId, body) =>
          postBookComment(bookKey, { body, parentCommentId }).then(() => undefined)
        }
      />
    </section>
  )
}
