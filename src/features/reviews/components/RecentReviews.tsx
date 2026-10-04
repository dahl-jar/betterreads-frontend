import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Avatar } from '@/components/Avatar'
import { BookCover } from '@/components/BookCover'
import { CommentIcon } from '@/components/icons'
import { Markdown } from '@/components/Markdown'
import { SectionHeading } from '@/components/SectionHeading'
import { StarRating } from '@/components/StarRating'
import { bookPath } from '@/lib/bookPath'
import { commentCountLabel } from '@/lib/commentCountLabel'
import { formatDate } from '@/lib/formatDate'

import { type RecentReview } from '../api/getRecentReviews'
import { useRecentReviews } from '../hooks/useRecentReviews'

import { ReviewWindow } from './ReviewWindow'
import { type RenderComments } from './reviewWindowItem'

const BODY_CLAMP_CLASS = 'max-h-[3.4em] overflow-hidden [&_p]:line-clamp-2'

const PARAGRAPH_BREAK = /\n\s*\n/

function openingParagraph(body: string): string {
  return body.trim().split(PARAGRAPH_BREAK)[0] ?? ''
}

type RecentReviewItemProps = {
  review: RecentReview
  onOpen: (reviewId: number) => void
}

function RecentReviewItem({ review, onOpen }: RecentReviewItemProps) {
  const { book } = review

  return (
    <li className="border-t border-rule">
      <article className="group relative -mx-3 flex gap-4 rounded-[3px] px-3 py-5 transition-colors hover:bg-sunken">
        <button
          type="button"
          onClick={() => onOpen(review.id)}
          aria-label={`Read ${review.author}'s review of ${book.title}`}
          className="absolute inset-0 rounded-[3px]"
        />
        <BookCover
          coverUrl={book.coverUrl}
          title={book.title}
          className="pointer-events-none relative h-24 w-16 shrink-0 rounded-[2px] shadow-cover"
        />
        <div className="pointer-events-none relative min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <Avatar name={review.author} size="xs" />
            <span className="text-sm font-semibold text-fg">{review.author}</span>
            {review.rating ? <StarRating value={review.rating} size="sm" /> : null}
            <time className="text-xs text-fg-3" dateTime={review.createdAt}>
              {formatDate(review.createdAt)}
            </time>
          </div>
          <p className="-mx-1 mt-1.5 truncate px-1 py-0.5 font-title">
            <Link
              to={bookPath(book.key)}
              className="pointer-events-auto relative text-fg no-underline hover-mark"
            >
              {book.title}
            </Link>
          </p>
          <div className={`mt-1 text-sm ${BODY_CLAMP_CLASS}`}>
            <Markdown source={openingParagraph(review.body)} />
          </div>
          <p className="mt-2.5 flex items-center gap-4 text-xs font-semibold">
            <span className="text-brand group-hover:underline group-hover:underline-offset-2">
              Read review
            </span>
            <span className="flex items-center gap-1 text-fg-2">
              <CommentIcon className="size-3.5" />
              {review.commentCount === 0
                ? 'No comments yet'
                : commentCountLabel(review.commentCount)}
            </span>
          </p>
        </div>
      </article>
    </li>
  )
}

export function RecentReviews({ renderComments }: { renderComments?: RenderComments }) {
  const { status, reviews } = useRecentReviews()
  const [openId, setOpenId] = useState<number | undefined>(undefined)

  if (status !== 'success' || reviews.length === 0) {
    return null
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-6">
      <SectionHeading title="Recent reviews" note="From BetterReads readers" />
      <ul className="mt-5 grid gap-x-10 md:grid-cols-2">
        {reviews.map((review) => (
          <RecentReviewItem key={review.id} review={review} onOpen={setOpenId} />
        ))}
      </ul>
      {openId === undefined ? null : (
        <ReviewWindow
          items={reviews.map((review) => ({ review, book: review.book }))}
          openId={openId}
          onOpen={setOpenId}
          onClose={() => setOpenId(undefined)}
          renderComments={renderComments}
        />
      )}
    </section>
  )
}
