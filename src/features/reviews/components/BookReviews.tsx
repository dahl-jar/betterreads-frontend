import { type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'

import { Avatar } from '@/components/Avatar'
import { StarRating } from '@/components/StarRating'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/formatDate'
import { type CurrentUser } from '@/types/auth'

import {
  REVIEW_BODY_MAX,
  REVIEW_TITLE_MAX,
  type Review,
  type UpsertReviewInput,
} from '../api/reviewSchemas'
import { useBookReviews } from '../hooks/useBookReviews'
import { useCommunityRating } from '../hooks/useCommunityRating'

import { CommunityRatingSummary } from './CommunityRatingSummary'

type BookReviewsProps = {
  bookKey: string
  onReviewChange?: (() => void) | undefined
  renderComments?: ((reviewId: number) => ReactNode) | undefined
}

export function BookReviews({ bookKey, onReviewChange, renderComments }: BookReviewsProps) {
  const { status: authStatus, user } = useAuth()
  const [ratingRefresh, setRatingRefresh] = useState(0)
  const reviewChanged = () => {
    setRatingRefresh((token) => token + 1)
    onReviewChange?.()
  }
  const { status, myReview, myReviewReady, reviews, save, remove } = useBookReviews(
    bookKey,
    reviewChanged,
  )
  const communityRating = useCommunityRating(bookKey, ratingRefresh)

  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl font-semibold text-ink">Ratings &amp; reviews</h2>

      {authStatus !== 'authenticated' ? (
        <Link
          to="/login"
          className="mt-4 inline-block rounded-md border border-green px-4 py-2 text-sm font-semibold text-green hover:bg-green-soft"
        >
          Sign in to rate this book
        </Link>
      ) : null}

      {authStatus === 'authenticated' && status === 'success' ? (
        <MyReviewCard
          review={myReview}
          ready={myReviewReady}
          reader={user}
          onSave={save}
          onRemove={remove}
        />
      ) : null}

      {status === 'loading' ? <ReviewsSkeleton /> : null}
      {status === 'error' ? (
        <p role="alert" className="mt-8 text-sm text-destructive">
          Could not load reviews. Try again later.
        </p>
      ) : null}
      {status === 'success' ? (
        <div className="mt-10">
          <h3 className="font-display text-xl font-semibold text-ink">Community reviews</h3>
          {communityRating ? <CommunityRatingSummary rating={communityRating} /> : null}
          <ul className="mt-4 space-y-6">
            {reviews.length === 0 && myReview === undefined ? (
              <li className="text-sm text-ink-soft">No reviews yet. Be the first to rate it.</li>
            ) : null}
            {reviews.map((review) => (
              <li key={review.id}>
                <ReviewItem review={review} renderComments={renderComments} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

type ReviewAction = 'save' | 'remove'

type MyReviewCardProps = {
  review: Review | undefined
  ready: boolean
  reader: CurrentUser | undefined
  onSave: (input: UpsertReviewInput) => Promise<void>
  onRemove: () => Promise<void>
}

function MyReviewCard({ review, ready, reader, onSave, onRemove }: MyReviewCardProps) {
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(false)
  const [failedAction, setFailedAction] = useState<ReviewAction | undefined>(undefined)

  const rating = review?.rating ?? 0
  const busy = pending || !ready

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

  function rate(stars: number) {
    void run('save', () => onSave(createReviewInput(stars, review?.title, review?.body)))
  }

  const readerName = reader?.displayName ?? reader?.username ?? 'You'

  return (
    <div className="mt-4 rounded-md border-2 border-green/40 bg-green-soft/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Avatar name={readerName} url={reader?.avatarUrl} size="sm" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">{readerName}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-green-deep">
              Your review
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <StarRating value={rating} onRate={rate} disabled={busy} />
      </div>

      {review?.title ? <p className="mt-3 font-semibold text-ink">{review.title}</p> : null}
      {review?.body ? (
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">{review.body}</p>
      ) : null}

      {editing ? (
        <ReviewTextEditor
          review={review}
          pending={pending}
          onSubmit={(input) => {
            void run('save', () => onSave(input)).then((saved) => {
              if (saved) {
                setEditing(false)
              }
            })
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={busy}
            className="text-sm font-semibold text-green hover:underline disabled:opacity-50"
          >
            {review?.title || review?.body ? 'Edit review' : 'Write a review'}
          </button>
          {review ? (
            <button
              type="button"
              onClick={() => void run('remove', onRemove)}
              disabled={busy}
              className="text-sm font-semibold text-destructive hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          ) : null}
        </div>
      )}

      {failedAction ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          Could not {failedAction} your review. Try again.
        </p>
      ) : null}
    </div>
  )
}

type ReviewTextEditorProps = {
  review: Review | undefined
  pending: boolean
  onSubmit: (input: UpsertReviewInput) => void
  onCancel: () => void
}

function ReviewTextEditor({ review, pending, onSubmit, onCancel }: ReviewTextEditorProps) {
  const [title, setTitle] = useState(review?.title ?? '')
  const [body, setBody] = useState(review?.body ?? '')

  function submit() {
    if (!review) {
      return
    }
    onSubmit(createReviewInput(review.rating ?? 1, title.trim(), body.trim()))
  }

  return (
    <div className="mt-3">
      {review ? null : (
        <p className="mb-2 text-sm text-ink-soft">Rate the book first, then write your review.</p>
      )}
      <label className="block text-sm font-semibold text-ink" htmlFor="review-title">
        Title
      </label>
      <input
        id="review-title"
        value={title}
        maxLength={REVIEW_TITLE_MAX}
        onChange={(event) => setTitle(event.target.value)}
        className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-ink"
      />

      <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="review-body">
        Review
      </label>
      <textarea
        id="review-body"
        value={body}
        maxLength={REVIEW_BODY_MAX}
        rows={5}
        onChange={(event) => setBody(event.target.value)}
        className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-ink"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !review}
          className="rounded-md bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-deep disabled:opacity-50"
        >
          Save review
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-semibold text-ink-soft hover:underline"
        >
          Cancel
        </button>
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
    <div className="mt-8 space-y-6" aria-busy="true" aria-label="Loading reviews">
      {[0, 1].map((row) => (
        <div key={row} className="rounded-md border border-line p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-3 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function ReviewItem({
  review,
  renderComments,
}: {
  review: Review
  renderComments?: ((reviewId: number) => ReactNode) | undefined
}) {
  return (
    <article className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <span />
        <time className="text-xs text-ink-faint" dateTime={review.createdAt}>
          {formatDate(review.createdAt)}
        </time>
      </div>
      {review.rating ? (
        <div className="mt-2">
          <StarRating value={review.rating} />
        </div>
      ) : null}
      {review.title ? <p className="mt-2 font-semibold text-ink">{review.title}</p> : null}
      {review.body ? (
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">{review.body}</p>
      ) : null}
      {renderComments?.(review.id)}
    </article>
  )
}
