import { Link } from 'react-router-dom'

import { Avatar } from '@/components/Avatar'
import { BookCover } from '@/components/BookCover'
import { Markdown } from '@/components/Markdown'
import { SectionHeading } from '@/components/SectionHeading'
import { StarRating } from '@/components/StarRating'
import { bookPath } from '@/lib/bookPath'
import { formatDate } from '@/lib/formatDate'

import { type RecentReview } from '../api/getRecentReviews'
import { useRecentReviews } from '../hooks/useRecentReviews'

const BODY_CLAMP_CLASS = 'max-h-[3.4em] overflow-hidden [&_p]:line-clamp-2'

const PARAGRAPH_BREAK = /\n\s*\n/

function openingParagraph(body: string): string {
  return body.trim().split(PARAGRAPH_BREAK)[0] ?? ''
}

function RecentReviewItem({ review }: { review: RecentReview }) {
  const { book } = review

  return (
    <li className="flex gap-4 border-t border-rule py-5">
      <BookCover
        coverUrl={book.coverUrl}
        title={book.title}
        className="h-24 w-16 shrink-0 rounded-[2px] shadow-cover"
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Avatar name={review.author} size="xs" />
          <span className="text-sm font-semibold text-fg">{review.author}</span>
          {review.rating === null || review.rating === undefined ? null : (
            <StarRating value={review.rating} size="sm" />
          )}
          <time className="text-xs text-fg-3" dateTime={review.createdAt}>
            {formatDate(review.createdAt)}
          </time>
        </div>
        <p className="-mx-1 mt-1.5 truncate px-1 py-0.5 font-title">
          <Link to={bookPath(book.key)} className="text-fg no-underline hover-mark">
            {book.title}
          </Link>
        </p>
        <div className={`mt-1 text-sm ${BODY_CLAMP_CLASS}`}>
          <Markdown source={openingParagraph(review.body)} />
        </div>
      </div>
    </li>
  )
}

export function RecentReviews() {
  const { status, reviews } = useRecentReviews()

  if (status !== 'success' || reviews.length === 0) {
    return null
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-6">
      <SectionHeading title="Recent reviews" note="From BetterReads readers" />
      <ul className="mt-5 grid gap-x-10 md:grid-cols-2">
        {reviews.map((review) => (
          <RecentReviewItem key={review.id} review={review} />
        ))}
      </ul>
    </section>
  )
}
