import { useEffect, useRef, useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/formatDate'

import { COMMENT_BODY_MAX, type Comment } from '../api/commentSchemas'
import { useCommentReplies } from '../hooks/useCommentReplies'
import { type WritableCommentThread } from '../hooks/useCommentThread'

type CommentThreadViewProps = {
  thread: WritableCommentThread
  postReply: (parentCommentId: number, body: string) => Promise<void>
  commentCount?: number | undefined
  openLabel?: string
  alwaysOpen?: boolean
}

function closedLabel(count: number | undefined, fallback: string): string {
  if (count === undefined || count === 0) {
    return fallback
  }
  return count === 1 ? '1 comment' : `${count} comments`
}

export function CommentThreadView({
  thread,
  postReply,
  commentCount,
  openLabel = 'Comment',
  alwaysOpen = false,
}: CommentThreadViewProps) {
  const { status: authStatus } = useAuth()
  const [open, setOpen] = useState(alwaysOpen)
  const loadedOnMount = useRef(false)

  useEffect(() => {
    if (alwaysOpen && !loadedOnMount.current) {
      loadedOnMount.current = true
      void thread.load()
    }
  }, [alwaysOpen, thread])

  function toggle() {
    if (!open) {
      void thread.load()
    }
    setOpen((current) => !current)
  }

  const body = (
    <div className="mt-3 space-y-4 border-l-2 border-line pl-4">
      {authStatus === 'authenticated' ? (
        <CommentForm placeholder="Add a comment" onSubmit={(body) => thread.post({ body })} />
      ) : null}

      {thread.status === 'error' ? (
        <p role="alert" className="text-sm text-destructive">
          Could not load comments. Try again.
        </p>
      ) : null}

      {thread.status === 'loading' && thread.comments.length === 0 ? <CommentsSkeleton /> : null}

      {thread.status === 'success' && thread.comments.length === 0 ? (
        <p className="text-sm text-ink-soft">No comments yet.</p>
      ) : null}

      <ul className="space-y-4">
        {thread.comments.map((comment) => (
          <li key={comment.id}>
            <CommentRow
              comment={comment}
              postReply={postReply}
              canReply={authStatus === 'authenticated'}
            />
          </li>
        ))}
      </ul>

      {thread.hasMore ? (
        <button
          type="button"
          onClick={() => void thread.loadMore()}
          disabled={thread.status === 'loading'}
          className="text-sm font-semibold text-green hover:underline disabled:opacity-50"
        >
          Show more comments
        </button>
      ) : null}
    </div>
  )

  if (alwaysOpen) {
    return <div className="mt-3">{body}</div>
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        className="text-sm font-semibold text-green hover:underline"
      >
        {open ? 'Hide comments' : closedLabel(commentCount, openLabel)}
      </button>
      {open ? body : null}
    </div>
  )
}

type CommentRowProps = {
  comment: Comment
  postReply: (parentCommentId: number, body: string) => Promise<void>
  canReply: boolean
}

function CommentRow({ comment, postReply, canReply }: CommentRowProps) {
  const [replying, setReplying] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [repliesVersion, setRepliesVersion] = useState(0)

  return (
    <div>
      <CommentBody comment={comment} />
      <div className="mt-1 flex gap-4 text-xs">
        {canReply ? (
          <button
            type="button"
            onClick={() => setReplying((current) => !current)}
            className="font-semibold text-green hover:underline"
          >
            Reply
          </button>
        ) : null}
        {comment.replyCount > 0 ? (
          <button
            type="button"
            onClick={() => setShowReplies((current) => !current)}
            className="font-semibold text-ink-soft hover:underline"
          >
            {showReplies
              ? 'Hide replies'
              : `Show ${comment.replyCount === 1 ? '1 reply' : `${comment.replyCount} replies`}`}
          </button>
        ) : null}
      </div>

      {replying ? (
        <div className="mt-2">
          <CommentForm
            placeholder="Write a reply"
            onSubmit={async (body) => {
              await postReply(comment.id, body)
              setReplying(false)
              setShowReplies(true)
              setRepliesVersion((current) => current + 1)
            }}
          />
        </div>
      ) : null}

      {showReplies ? <CommentReplies key={repliesVersion} commentId={comment.id} /> : null}
    </div>
  )
}

function CommentReplies({ commentId }: { commentId: number }) {
  const replies = useCommentReplies(commentId)
  const loaded = useRef(false)

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true
      void replies.load()
    }
  }, [replies])

  if (replies.status === 'error') {
    return (
      <p role="alert" className="mt-2 pl-4 text-xs text-destructive">
        Could not load replies.
      </p>
    )
  }

  return (
    <div className="mt-2 border-l-2 border-line pl-4">
      <ul className="space-y-3">
        {replies.comments.map((reply) => (
          <li key={reply.id}>
            <CommentBody comment={reply} />
          </li>
        ))}
      </ul>
      {replies.hasMore ? (
        <button
          type="button"
          onClick={() => void replies.loadMore()}
          disabled={replies.status === 'loading'}
          className="mt-2 text-xs font-semibold text-green hover:underline disabled:opacity-50"
        >
          Show more replies
        </button>
      ) : null}
    </div>
  )
}

function CommentsSkeleton() {
  return (
    <ul className="space-y-4" aria-busy="true" aria-label="Loading comments">
      {[0, 1].map((row) => (
        <li key={row}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-3 w-3/4" />
        </li>
      ))}
    </ul>
  )
}

function CommentBody({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-2">
      <Avatar name={comment.author} size="sm" />
      <div>
        <p className="text-sm">
          <span className="font-semibold text-ink">{comment.author}</span>{' '}
          <time className="text-xs text-ink-faint" dateTime={comment.createdAt}>
            {formatDate(comment.createdAt)}
          </time>
        </p>
        <p className="mt-0.5 whitespace-pre-line text-sm text-ink">{comment.body}</p>
      </div>
    </div>
  )
}

type CommentFormProps = {
  placeholder: string
  onSubmit: (body: string) => Promise<void>
}

function CommentForm({ placeholder, onSubmit }: CommentFormProps) {
  const { user } = useAuth()
  const [body, setBody] = useState('')
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  const name = user?.displayName ?? user?.username ?? 'You'

  async function submit() {
    const trimmed = body.trim()
    if (trimmed === '') {
      return
    }
    setPending(true)
    setFailed(false)
    try {
      await onSubmit(trimmed)
      setBody('')
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-muted/40 px-4 py-3 transition focus-within:border-green/60 focus-within:bg-surface focus-within:ring-2 focus-within:ring-green-soft">
      <div className="flex gap-3">
        <Avatar name={name} url={user?.avatarUrl} size="sm" />
        <textarea
          value={body}
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={COMMENT_BODY_MAX}
          rows={2}
          onChange={(event) => setBody(event.target.value)}
          className="mt-1 w-full resize-none bg-transparent text-ink placeholder:text-ink-faint focus:outline-none"
        />
      </div>
      <div className="mt-2 flex items-center justify-end gap-3 border-t border-line/60 pt-2">
        {failed ? (
          <span className="mr-auto text-xs text-destructive">Could not post. Try again.</span>
        ) : null}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={pending || body.trim() === ''}
          className="rounded-full bg-green px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-green-deep disabled:opacity-50"
        >
          Post
        </button>
      </div>
    </div>
  )
}
