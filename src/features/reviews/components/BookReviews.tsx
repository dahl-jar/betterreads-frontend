import { type ReactNode, useEffect, useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { LoginLink } from '@/components/LoginLink'
import { Markdown } from '@/components/Markdown'
import { StarRating } from '@/components/StarRating'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/formatDate'
import { type CurrentUser } from '@/types/auth'

import { type Review, type UpsertReviewInput } from '../api/reviewSchemas'
import { useBookReviews } from '../hooks/useBookReviews'

import { ReviewEditor } from './ReviewEditor'

const REVIEW_CLAMP_CHARS = 420

const BODY_CLAMP_CLASS = 'max-h-[8.5em] overflow-hidden'

type RenderComments = (reviewId: number, commentCount: number) => ReactNode

type BookReviewsProps = {
  bookKey: string
  onReviewChange?: (() => void) | undefined
  onTotalChange?: ((total: number) => void) | undefined
  renderComments?: RenderComments | undefined
}

export function BookReviews({
  bookKey,
  onReviewChange,
  onTotalChange,
  renderComments,
}: BookReviewsProps) {
  const { status: authStatus, user } = useAuth()
  const { status, total, myReview, myReviewReady, reviews, save, remove } = useBookReviews(
    bookKey,
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
  reviews: Review[]
  myReview: Review | undefined
  ready: boolean
  reader: CurrentUser | undefined
  onSave: (input: UpsertReviewInput) => Promise<void>
  onRemove: () => Promise<void>
  renderComments: RenderComments | undefined
}

function ReviewList({
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

  const rating = myReview?.rating ?? 0
  const busy = pending || !ready
  const ownListed = myReview !== undefined && !editing

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
            rating={rating}
            pending={busy}
            onRate={(stars) => void rate(stars)}
            onSubmit={({ title, body }) => {
              void run('save', () => onSave(createReviewInput(rating, title, body))).then(
                (saved) => {
                  if (saved) {
                    setEditing(false)
                  }
                },
              )
            }}
            onCancel={() => setEditing(false)}
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
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={busy}
            className="mt-3 text-sm font-semibold text-brand hover-mark disabled:opacity-50"
          >
            Write a review
          </button>
        </div>
      ) : null}

      {failedAction ? (
        <p role="alert" className="text-sm text-destructive">
          Could not {failedAction} your review. Try again.
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
              renderComments={renderComments}
            />
          ) : null}
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} renderComments={renderComments} />
          ))}
        </ul>
      ) : null}
    </>
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
  renderComments: RenderComments | undefined
}

function ReviewItem({ review, avatarUrl, ownActions, renderComments }: ReviewItemProps) {
  const [expanded, setExpanded] = useState(false)
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
          <div className={`mt-2 ${long && !expanded ? BODY_CLAMP_CLASS : ''}`}>
            <Markdown source={review.body} />
          </div>
        ) : null}
        {long ? (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            className="mt-1.5 text-sm font-semibold text-brand hover-mark"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        ) : null}
        {ownActions}
        {renderComments?.(review.id, review.commentCount)}
      </div>
    </li>
  )
}
