import { postBookComment } from '../api/postBookComment'
import { useBookComments } from '../hooks/useBookComments'

import { CommentThreadView } from './CommentThreadView'

const DISCUSSION_PAGE_SIZE = 5

type BookCommentsProps = {
  bookKey: string
}

export function BookComments({ bookKey }: BookCommentsProps) {
  const thread = useBookComments(bookKey, DISCUSSION_PAGE_SIZE)
  return (
    <section className="mt-6">
      <h2 className="font-title text-2xl text-fg">Discussion</h2>
      <p className="mt-1 text-sm text-fg-2">Talk about this book with other readers.</p>
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
