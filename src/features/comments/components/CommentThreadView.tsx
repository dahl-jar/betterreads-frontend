import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

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
  alwaysOpen?: boolean
}

const NO_COMMENTS_LABEL = 'Comment'

function closedLabel(count: number | undefined): string {
  if (count === undefined || count === 0) {
    return NO_COMMENTS_LABEL
  }
  return count === 1 ? '1 comment' : `${count} comments`
}

export function CommentThreadView({
  thread,
  postReply,
  commentCount,
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
    <div className="mt-4 border-t border-rule pt-5">
      {thread.status === 'error' ? (
        <p role="alert" className="text-sm text-destructive">
          Could not load comments. Try again.
        </p>
      ) : null}

      {thread.status === 'loading' && thread.comments.length === 0 ? <CommentsSkeleton /> : null}

      {thread.status === 'success' && thread.comments.length === 0 ? (
        <p className="text-sm text-fg-2">No comments yet.</p>
      ) : null}

      <ul className="flex flex-col gap-5">
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
          className="mt-5 text-sm font-semibold text-brand hover-mark disabled:opacity-50"
        >
          Show more comments
        </button>
      ) : null}

      <div className="mt-6">
        {authStatus === 'authenticated' ? (
          <CommentForm placeholder="Add a comment" onSubmit={(body) => thread.post({ body })} />
        ) : null}
        {authStatus === 'anonymous' ? (
          <p className="text-sm text-fg-2">
            <Link to="/login" className="font-semibold text-fg underline underline-offset-2">
              Log in
            </Link>{' '}
            to comment.
          </p>
        ) : null}
      </div>
    </div>
  )

  if (alwaysOpen) {
    return body
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="text-sm font-semibold text-fg-2 hover-mark"
      >
        {open
          ? 'Hide comments'
          : closedLabel(thread.status === 'success' ? thread.total : commentCount)}
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
      <div className="mt-1.5 flex gap-4 pl-11 text-xs font-semibold text-fg-2">
        {canReply ? (
          <button
            type="button"
            onClick={() => setReplying((current) => !current)}
            className="hover-mark"
          >
            Reply
          </button>
        ) : null}
        {comment.replyCount > 0 ? (
          <button
            type="button"
            onClick={() => setShowReplies((current) => !current)}
            aria-expanded={showReplies}
            className="hover-mark"
          >
            {showReplies
              ? 'Hide replies'
              : `Show ${comment.replyCount === 1 ? '1 reply' : `${comment.replyCount} replies`}`}
          </button>
        ) : null}
      </div>

      {replying ? (
        <div className="mt-3 pl-11">
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
      <p role="alert" className="mt-2 pl-11 text-xs text-destructive">
        Could not load replies.
      </p>
    )
  }

  return (
    <div className="ml-11 mt-4 border-l border-rule pl-4">
      <ul className="flex flex-col gap-4">
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
          className="mt-3 text-xs font-semibold text-brand hover-mark disabled:opacity-50"
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
    <div className="flex gap-3">
      <Avatar name={comment.author} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold text-fg">{comment.author}</span>{' '}
          <time className="ml-1 text-xs text-fg-3" dateTime={comment.createdAt}>
            {formatDate(comment.createdAt)}
          </time>
        </p>
        <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-fg">{comment.body}</p>
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
    <div className="flex gap-3">
      <Avatar name={name} url={user?.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <textarea
          value={body}
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={COMMENT_BODY_MAX}
          rows={2}
          onChange={(event) => setBody(event.target.value)}
          className="w-full resize-none rounded-md border border-rule bg-raised px-3 py-2 text-fg outline-none placeholder:text-fg-3 focus:border-fg-2"
        />
        <div className="mt-2 flex items-center justify-end gap-3">
          {failed ? (
            <span className="mr-auto text-xs text-destructive">Could not post. Try again.</span>
          ) : null}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={pending || body.trim() === ''}
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  )
}
