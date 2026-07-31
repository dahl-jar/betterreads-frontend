import { lazy, Suspense, useState } from 'react'

import { TabList } from '@/components/TabList'
import { BookReviews } from '@/features/reviews/components/BookReviews'

const BookComments = lazy(() =>
  import('@/features/comments/components/BookComments').then((module) => ({
    default: module.BookComments,
  })),
)

const ReviewComments = lazy(() =>
  import('@/features/comments/components/ReviewComments').then((module) => ({
    default: module.ReviewComments,
  })),
)

type BookActivityProps = {
  bookKey: string
  onReviewChange?: () => void
}

type Tab = 'reviews' | 'comments'

const TABS: { id: Tab; label: string }[] = [
  { id: 'reviews', label: 'Reviews' },
  { id: 'comments', label: 'Comments' },
]

export function BookActivity({ bookKey, onReviewChange }: BookActivityProps) {
  const [tab, setTab] = useState<Tab>('reviews')

  return (
    <div className="mt-12">
      <TabList tabs={TABS} activeTab={tab} ariaLabel="Reviews and comments" onTabChange={setTab} />

      {tab === 'reviews' ? (
        <BookReviews
          bookKey={bookKey}
          onReviewChange={onReviewChange}
          renderComments={(reviewId) => (
            <Suspense fallback={null}>
              <ReviewComments reviewId={reviewId} />
            </Suspense>
          )}
        />
      ) : (
        <Suspense fallback={null}>
          <BookComments bookKey={bookKey} />
        </Suspense>
      )}
    </div>
  )
}
