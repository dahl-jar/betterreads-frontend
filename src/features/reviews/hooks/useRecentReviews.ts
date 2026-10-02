import { useEffect, useState } from 'react'

import { getRecentReviews, type RecentReview } from '../api/getRecentReviews'

type RecentReviewsState = {
  status: 'loading' | 'success' | 'error'
  reviews: RecentReview[]
}

const RECENT_REVIEW_LIMIT = 6

const LOADING_STATE: RecentReviewsState = { status: 'loading', reviews: [] }

export function useRecentReviews(): RecentReviewsState {
  const [state, setState] = useState(LOADING_STATE)

  useEffect(() => {
    const controller = new AbortController()
    getRecentReviews(RECENT_REVIEW_LIMIT, controller.signal)
      .then((reviews) => setState({ status: 'success', reviews }))
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ status: 'error', reviews: [] })
        }
      })
    return () => controller.abort()
  }, [])

  return state
}
