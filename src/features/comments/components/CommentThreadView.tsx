import { useEffect, useRef, useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { DraftStatus } from '@/components/DraftStatus'
import { LoginLink } from '@/components/LoginLink'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useDraft } from '@/hooks/useDraft'
import { useDraftGuard } from '@/hooks/useDraftGuard'
import { replyDraftKey } from '@/lib/draftKeys'
import { hasDraftText } from '@/lib/draftStore'
import { formatDate } from '@/lib/formatDate'

import { COMMENT_BODY_MAX, type Comment } from '../api/commentSchemas'
import { useCommentReplies } from '../hooks/useCommentReplies'
import { type WritableCommentThread } from '../hooks/useCommentThread'

type CommentThreadViewProps = {
  thread: WritableCommentThread
  postReply: (parentCommentId: number, body: string) => Promise<void>
  draftKey: string
  pinComposer?: boolean
}

export function CommentThreadView({
  thread,
  postReply,
  draftKey,
  pinComposer = false,
}: CommentThreadViewProps) {
  const { status: authStatus } = useAuth()
  const loadedOnMount = useRef(false)

  useEffect(() => {
    if (!loadedOnMount.current) {
      loadedOnMount.current = true
      void thread.load()
    }
  }, [thread])

  return (
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

      <div
        className={
          pinComposer
            ? 'sticky bottom-0 -mx-1 mt-6 border-t border-rule bg-raised px-1 py-3'
            : 'mt-6'
        }
      >
        {authStatus === 'authenticated' ? (
          <CommentForm
            draftKey={draftKey}
            placeholder="Add a comment"
            onSubmit={(body) => thread.post({ body })}
          />
        ) : null}
        {authStatus === 'anonymous' ? (
          <p className="text-sm text-fg-2">
            <LoginLink className="font-semibold text-fg underline underline-offset-2">
              Log in
            </LoginLink>{' '}
            to comment.
          </p>
        ) : null}
      </div>
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
  const replyKey = replyDraftKey(comment.id)
  const { draft: replyDraft } = useDraft(replyKey)
  const { confirmLeave } = useDraftGuard()

  async function toggleReply() {
    if (replying && (await confirmLeave([replyKey])) === 'cancel') {
      return
    }
    setReplying((current) => !current)
  }

  return (
    <div>
      <CommentBody comment={comment} />
      <div className="mt-1.5 flex gap-4 pl-11 text-xs font-semibold text-fg-2">
        {canReply ? (
          <button type="button" onClick={() => void toggleReply()} className="hover-mark">
            Reply
            {!replying && hasDraftText(replyDraft) ? (
              <>
                {' '}
                <span className="font-normal text-fg-3">(draft)</span>
              </>
            ) : null}
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
            draftKey={replyKey}
            placeholder="Write a reply"
            onSubmit={async (body) => {
              await postReply(comment.id, body)
              setReplying(false)
              setShowReplies(true)
              setRepliesVersion((current) => current + 1)
            }}
            onCancel={() => setReplying(false)}
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
  draftKey: string
  placeholder: string
  onSubmit: (body: string) => Promise<void>
  onCancel?: () => void
}

function CommentForm({ draftKey, placeholder, onSubmit, onCancel }: CommentFormProps) {
  const { user } = useAuth()
  const { draft, update, discard } = useDraft(draftKey)
  const { confirmLeave } = useDraftGuard()
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  const name = user?.displayName ?? user?.username ?? 'You'
  const body = draft?.body ?? ''
  const written = hasDraftText(draft)

  async function submit() {
    const trimmed = body.trim()
    if (trimmed === '') {
      return
    }
    setPending(true)
    setFailed(false)
    try {
      await onSubmit(trimmed)
      discard()
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  async function cancel() {
    if ((await confirmLeave([draftKey])) === 'cancel') {
      return
    }
    setFailed(false)
    onCancel?.()
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
          onChange={(event) => update('body', event.target.value)}
          className="w-full resize-none rounded-md border border-rule bg-raised px-3 py-2 text-fg outline-none placeholder:text-fg-3 focus:border-fg-2"
        />
        {failed ? (
          <p role="alert" className="mt-1 text-xs text-destructive">
            Could not post. Your text is saved as a draft. Try again.
          </p>
        ) : null}
        <div className="mt-2 flex items-center gap-3">
          <DraftStatus draft={draft} />
          <span className="ml-auto flex items-center gap-3">
            {written || onCancel ? (
              <button
                type="button"
                onClick={() => void cancel()}
                className="rounded-md px-3 py-1.5 text-sm font-semibold text-fg-2 hover:bg-sunken hover:text-fg"
              >
                Cancel
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void submit()}
              disabled={pending || body.trim() === ''}
              className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50"
            >
              Post
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}
