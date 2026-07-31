import { getReviewPage } from './getReviewPage'
import { type Review } from './reviewSchemas'

const MY_REVIEWS_SCAN_LIMIT = 100

export async function findMyReviewForBook(
  bookKey: string,
  signal?: AbortSignal,
): Promise<Review | undefined> {
  let loaded = 0
  let total = Infinity
  while (loaded < total) {
    const page = await getReviewPage('/api/v1/me/reviews', loaded, MY_REVIEWS_SCAN_LIMIT, signal)
    const ownReview = page.reviews.find((review) => review.bookKey === bookKey)
    if (ownReview !== undefined) {
      return ownReview
    }
    loaded += page.reviews.length
    total = page.reviews.length === 0 ? loaded : page.total
  }
  return undefined
}
