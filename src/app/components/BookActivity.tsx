import { lazy, Suspense, useState } from 'react'

import { TabList } from '@/components/TabList'
import { BookReviews } from '@/features/reviews/components/BookReviews'
import { type ReviewWindowBook } from '@/features/reviews/components/reviewWindowItem'

import { ReviewThread } from './ReviewThread'

const BookComments = lazy(() =>
  import('@/features/comments/components/BookComments').then((module) => ({
    default: module.BookComments,
  })),
)

type BookActivityProps = {
  book: ReviewWindowBook
  onReviewChange?: () => void
  onTotalChange?: (total: number) => void
}

type Tab = 'reviews' | 'comments'

const TABS: { id: Tab; label: string }[] = [
  { id: 'reviews', label: 'Reviews' },
  { id: 'comments', label: 'Discussions' },
]

export function BookActivity({ book, onReviewChange, onTotalChange }: BookActivityProps) {
  const [tab, setTab] = useState<Tab>('reviews')

  return (
    <div className="mt-10">
      <TabList
        tabs={TABS}
        activeTab={tab}
        ariaLabel="Reviews and discussions"
        onTabChange={setTab}
      />

      {tab === 'reviews' ? (
        <BookReviews
          book={book}
          onReviewChange={onReviewChange}
          onTotalChange={onTotalChange}
          renderComments={(reviewId) => <ReviewThread reviewId={reviewId} />}
        />
      ) : (
        <Suspense fallback={null}>
          <BookComments bookKey={book.key} />
        </Suspense>
      )}
    </div>
  )
}
