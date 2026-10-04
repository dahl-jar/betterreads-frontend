import { type ReactNode, useEffect, useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { DraftStatus } from '@/components/DraftStatus'
import { CommentIcon } from '@/components/icons'
import { LoginLink } from '@/components/LoginLink'
import { Markdown } from '@/components/Markdown'
import { StarRating } from '@/components/StarRating'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useDraft } from '@/hooks/useDraft'
import { useDraftGuard } from '@/hooks/useDraftGuard'
import { commentCountLabel } from '@/lib/commentCountLabel'
import { reviewDraftKey } from '@/lib/draftKeys'
import { type Draft, hasDraftText } from '@/lib/draftStore'
import { formatDate } from '@/lib/formatDate'
import { type CurrentUser } from '@/types/auth'

import { type Review, type UpsertReviewInput } from '../api/reviewSchemas'
import { useBookReviews } from '../hooks/useBookReviews'

import { ReviewEditor } from './ReviewEditor'
import { ReviewWindow } from './ReviewWindow'
import {
  type OpenReview,
  type RenderComments,
  type ReviewSection,
  type ReviewWindowBook,
} from './reviewWindowItem'

const REVIEW_CLAMP_CHARS = 420

type OpenedReview = {
  id: number
  section: ReviewSection | undefined
}

type BookReviewsProps = {
  book: ReviewWindowBook
  onReviewChange?: (() => void) | undefined
  onTotalChange?: ((total: number) => void) | undefined
  renderComments?: RenderComments | undefined
}

export function BookReviews({
  book,
  onReviewChange,
  onTotalChange,
  renderComments,
}: BookReviewsProps) {
  const { status: authStatus, user } = useAuth()
  const { status, total, myReview, myReviewReady, reviews, save, remove } = useBookReviews(
    book.key,
    onReviewChange,
  )
  const signedIn = authStatus === 'authenticated'

  useEffect(() => {
    if (total !== undefined) {
      onTotalChange?.(total)
    }
  }, [total, onTotalChange])

  return (
    <section className="mt-8">
      <h2 className="font-title text-2xl text-fg">Ratings &amp; reviews</h2>

      <div className="mt-6 flex min-w-0 flex-col gap-6">
        {signedIn ? null : (
          <LoginLink className="inline-flex self-start rounded-md border border-rule px-4 py-2 text-sm font-semibold text-fg hover:border-fg-3">
            Log in to rate this book
          </LoginLink>
        )}

        {status === 'loading' ? <ReviewsSkeleton /> : null}
        {status === 'error' ? (
          <p role="alert" className="text-sm text-destructive">
            Could not load reviews. Try again later.
          </p>
        ) : null}
        {status === 'success' ? (
          <ReviewList
            book={book}
            reviews={reviews}
            myReview={myReview}
            ready={myReviewReady}
            reader={signedIn ? user : undefined}
            onSave={save}
            onRemove={remove}
            renderComments={renderComments}
          />
        ) : null}
      </div>
    </section>
  )
}

type ReviewAction = 'save' | 'remove'

type ReviewListProps = {
  book: ReviewWindowBook
  reviews: Review[]
  myReview: Review | undefined
  ready: boolean
  reader: CurrentUser | undefined
  onSave: (input: UpsertReviewInput) => Promise<void>
  onRemove: () => Promise<void>
  renderComments: RenderComments | undefined
}

function ReviewList({
  book,
  reviews,
  myReview,
  ready,
  reader,
  onSave,
  onRemove,
  renderComments,
}: ReviewListProps) {
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(false)
  const [failedAction, setFailedAction] = useState<ReviewAction | undefined>(undefined)
  const [opened, setOpened] = useState<OpenedReview | undefined>(undefined)
  const draftKey = reviewDraftKey(book.key)
  const { draft, update, discard } = useDraft(draftKey)
  const { confirmLeave } = useDraftGuard()

  const rating = myReview?.rating ?? 0
  const busy = pending || !ready
  const ownListed = myReview !== undefined && !editing
  const listed = ownListed ? [myReview, ...reviews] : reviews
  const unfinished = reader !== undefined && !editing && hasDraftText(draft)
  const openReview: OpenReview = (id, section) => setOpened({ id, section })

  async function cancelEditing() {
    if ((await confirmLeave([draftKey])) !== 'cancel') {
      setFailedAction(undefined)
      setEditing(false)
    }
  }

  async function run(action: ReviewAction, request: () => Promise<void>): Promise<boolean> {
    setPending(true)
    setFailedAction(undefined)
    try {
      await request()
      return true
    } catch {
      setFailedAction(action)
      return false
    } finally {
      setPending(false)
    }
  }

  function rate(stars: number): Promise<boolean> {
    return run('save', () => onSave(createReviewInput(stars, myReview?.title, myReview?.body)))
  }

  return (
    <>
      {reader && editing ? (
        <div className="rounded-xl border border-rule bg-raised p-5 md:p-6">
          <ReaderHeading reader={reader} caption="Your review" />
          <ReviewEditor
            review={myReview}
            draft={draft}
            onTextChange={update}
            rating={rating}
            pending={busy}
            onRate={(stars) => void rate(stars)}
            onSubmit={({ title, body }) => {
              void run('save', () => onSave(createReviewInput(rating, title, body))).then(
                (saved) => {
                  if (saved) {
                    discard()
                    setEditing(false)
                  }
                },
              )
            }}
            onCancel={() => void cancelEditing()}
          />
        </div>
      ) : null}

      {reader && !editing && myReview === undefined ? (
        <div className="rounded-xl border border-rule bg-raised p-5">
          <ReaderHeading reader={reader} caption="Rate this book" />
          <div className="mt-3">
            <StarRating
              value={rating}
              onRate={(stars) => {
                void rate(stars).then((saved) => {
                  if (saved) {
                    setEditing(true)
                  }
                })
              }}
              disabled={busy}
            />
          </div>
          {unfinished ? (
            <UnfinishedReview
              draft={draft}
              disabled={busy}
              onContinue={() => setEditing(true)}
              onDiscard={discard}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={busy}
              className="mt-3 text-sm font-semibold text-brand hover-mark disabled:opacity-50"
            >
              Write a review
            </button>
          )}
        </div>
      ) : null}

      {unfinished && myReview !== undefined ? (
        <UnfinishedReview
          draft={draft}
          disabled={busy}
          onContinue={() => setEditing(true)}
          onDiscard={discard}
        />
      ) : null}

      {failedAction ? (
        <p role="alert" className="text-sm text-destructive">
          {failedAction === 'save' && hasDraftText(draft)
            ? 'Could not save your review. Your text is saved as a draft. Try again.'
            : `Could not ${failedAction} your review. Try again.`}
        </p>
      ) : null}

      {reviews.length === 0 && myReview === undefined ? (
        <p className="text-sm text-fg-2">No reviews yet. Be the first to rate it.</p>
      ) : null}
      {ownListed || reviews.length > 0 ? (
        <ul className="flex flex-col">
          {ownListed ? (
            <ReviewItem
              key={myReview.id}
              review={myReview}
              avatarUrl={reader?.avatarUrl}
              ownActions={
                <p className="mt-3 flex gap-4 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    disabled={busy}
                    className="text-brand hover-mark disabled:opacity-50"
                  >
                    {myReview.title || myReview.body ? 'Edit review' : 'Write a review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void run('remove', onRemove)}
                    disabled={busy}
                    className="text-fg-2 hover-mark disabled:opacity-50"
                  >
                    Remove
                  </button>
                </p>
              }
              onOpen={openReview}
            />
          ) : null}
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} onOpen={openReview} />
          ))}
        </ul>
      ) : null}

      {opened ? (
        <ReviewWindow
          items={listed.map((review) => ({ review, book }))}
          openId={opened.id}
          section={opened.section}
          onOpen={openReview}
          onClose={() => setOpened(undefined)}
          renderComments={renderComments}
        />
      ) : null}
    </>
  )
}

type UnfinishedReviewProps = {
  draft: Draft
  disabled: boolean
  onContinue: () => void
  onDiscard: () => void
}

function UnfinishedReview({ draft, disabled, onContinue, onDiscard }: UnfinishedReviewProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-sunken px-3.5 py-2.5 text-sm">
      <span className="font-semibold text-fg">You have an unfinished review</span>
      <DraftStatus draft={draft} />
      <span className="ml-auto flex gap-4 font-semibold">
        <button
          type="button"
          onClick={onContinue}
          disabled={disabled}
          className="text-brand hover-mark disabled:opacity-50"
        >
          Continue writing
        </button>
        <button type="button" onClick={onDiscard} className="text-fg-2 hover-mark">
          Discard
        </button>
      </span>
    </div>
  )
}

function ReaderHeading({ reader, caption }: { reader: CurrentUser; caption: string }) {
  const name = reader.displayName ?? reader.username

  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} url={reader.avatarUrl} />
      <div className="leading-tight">
        <p className="text-sm font-semibold text-fg">{name}</p>
        <p className="text-xs text-fg-3">{caption}</p>
      </div>
    </div>
  )
}

function createReviewInput(
  rating: number,
  title: string | null | undefined,
  body: string | null | undefined,
): UpsertReviewInput {
  return {
    rating,
    ...(title ? { title } : {}),
    ...(body ? { body } : {}),
  }
}

function ReviewsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading reviews">
      {[0, 1].map((row) => (
        <div key={row} className="border-t border-rule pt-6">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-3 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

type ReviewItemProps = {
  review: Review
  avatarUrl?: string | null | undefined
  ownActions?: ReactNode
  onOpen: OpenReview
}

function ReviewItem({ review, avatarUrl, ownActions, onOpen }: ReviewItemProps) {
  const long = (review.body ?? '').length > REVIEW_CLAMP_CHARS

  return (
    <li className="grid gap-x-10 gap-y-3 border-t border-rule py-6 md:grid-cols-[11rem_minmax(0,1fr)]">
      <div className="flex items-center gap-3 md:items-start">
        <Avatar name={review.author} url={avatarUrl} />
        <div className="min-w-0 leading-snug">
          <p className="truncate text-sm font-semibold text-fg">{review.author}</p>
          {ownActions ? <p className="text-xs font-semibold text-brand">Your review</p> : null}
          <time className="text-xs text-fg-3" dateTime={review.createdAt}>
            {formatDate(review.createdAt)}
          </time>
        </div>
      </div>
      <div className="min-w-0">
        {review.rating ? <StarRating value={review.rating} /> : null}
        {review.title ? (
          <p className="mt-2 font-title text-lg font-bold text-fg">{review.title}</p>
        ) : null}
        {review.body ? (
          <div className={`mt-2 ${long ? 'line-clamp-5 [&>div]:block [&_p+p]:mt-3' : ''}`}>
            <Markdown source={review.body} />
          </div>
        ) : null}
        {ownActions}
        <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold">
          {long ? (
            <button
              type="button"
              onClick={() => onOpen(review.id)}
              className="text-brand hover-mark"
            >
              Read full review
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onOpen(review.id, 'comments')}
            className="flex items-center gap-1.5 text-fg-2 hover-mark"
          >
            <CommentIcon className="size-4" />
            {review.commentCount === 0 ? 'Comment' : commentCountLabel(review.commentCount)}
          </button>
        </p>
      </div>
    </li>
  )
}
