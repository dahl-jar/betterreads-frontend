import { lazy, Suspense } from 'react'

const ReviewComments = lazy(() =>
  import('@/features/comments/components/ReviewComments').then((module) => ({
    default: module.ReviewComments,
  })),
)

export function ReviewThread({ reviewId }: { reviewId: number }) {
  return (
    <Suspense fallback={null}>
      <ReviewComments reviewId={reviewId} />
    </Suspense>
  )
}
