import { useCallback, useEffect, useReducer, useRef } from 'react'

import { useAuth } from '@/hooks/useAuth'

import { deleteMyReview } from '../api/deleteMyReview'
import { findMyReviewForBook } from '../api/findMyReviewForBook'
import { getBookReviews } from '../api/getBookReviews'
import { type Review, type UpsertReviewInput } from '../api/reviewSchemas'
import { upsertMyReview } from '../api/upsertMyReview'

export type ReviewsStatus = 'loading' | 'success' | 'error'

type ReviewsState = {
  status: ReviewsStatus
  myReview: Review | undefined
  myReviewReady: boolean
  reviews: Review[]
  total: number | undefined
}

export type BookReviews = ReviewsState & {
  save: (input: UpsertReviewInput) => Promise<void>
  remove: () => Promise<void>
}

type OwnReview = {
  review: Review | undefined
  known: boolean
}

type ReviewsAction =
  | { type: 'loading'; ownReviewPending: boolean; preservePublicReviews: boolean }
  | {
      type: 'loaded'
      myReview: Review | undefined
      myReviewReady: boolean
      reviews: Review[]
      total: number
    }
  | { type: 'failed' }
  | { type: 'saved'; review: Review }
  | { type: 'removed' }

const INITIAL_STATE: ReviewsState = {
  status: 'loading',
  myReview: undefined,
  myReviewReady: false,
  reviews: [],
  total: undefined,
}

function reviewsReducer(state: ReviewsState, action: ReviewsAction): ReviewsState {
  switch (action.type) {
    case 'loading':
      return {
        status: action.preservePublicReviews && state.status === 'success' ? 'success' : 'loading',
        myReview: undefined,
        myReviewReady: !action.ownReviewPending,
        reviews: action.preservePublicReviews ? state.reviews : [],
        total: action.preservePublicReviews ? state.total : undefined,
      }
    case 'loaded':
      return {
        status: 'success',
        myReview: action.myReview,
        myReviewReady: action.myReviewReady,
        reviews: action.reviews,
        total: action.total,
      }
    case 'failed':
      return {
        status: 'error',
        myReview: undefined,
        myReviewReady: true,
        reviews: [],
        total: undefined,
      }
    case 'saved':
      return {
        ...state,
        myReview: action.review,
        reviews: state.reviews.filter((review) => review.id !== action.review.id),
      }
    case 'removed':
      return { ...state, myReview: undefined }
  }
}

/** Keeps public reviews available when the own-review lookup fails. */
export function useBookReviews(bookKey: string, onReviewChange?: () => void): BookReviews {
  const { status: authStatus } = useAuth()
  const signedIn = authStatus === 'authenticated'
  const [state, dispatch] = useReducer(reviewsReducer, INITIAL_STATE)
  const loadedBookKey = useRef<string | undefined>(undefined)

  useEffect(() => {
    const controller = new AbortController()
    const preservePublicReviews = loadedBookKey.current === bookKey
    loadedBookKey.current = bookKey
    dispatch({ type: 'loading', ownReviewPending: signedIn, preservePublicReviews })

    const ownReview: Promise<OwnReview> = signedIn
      ? findMyReviewForBook(bookKey, controller.signal)
          .then((review) => ({ review, known: true }))
          .catch((error: unknown) => {
            if (controller.signal.aborted) {
              throw error
            }
            return { review: undefined, known: false }
          })
      : Promise.resolve({ review: undefined, known: true })

    Promise.all([getBookReviews(bookKey, 0, undefined, controller.signal), ownReview])
      .then(([page, own]) => {
        const reviews = own.review
          ? page.reviews.filter((review) => review.id !== own.review?.id)
          : page.reviews
        dispatch({
          type: 'loaded',
          myReview: own.review,
          myReviewReady: own.known,
          reviews,
          total: page.total,
        })
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          dispatch({ type: 'failed' })
        }
      })

    return () => controller.abort()
  }, [bookKey, signedIn])

  const save = useCallback(
    async (input: UpsertReviewInput) => {
      const saved = await upsertMyReview(bookKey, input)
      dispatch({ type: 'saved', review: saved })
      onReviewChange?.()
    },
    [bookKey, onReviewChange],
  )

  const remove = useCallback(async () => {
    await deleteMyReview(bookKey)
    dispatch({ type: 'removed' })
    onReviewChange?.()
  }, [bookKey, onReviewChange])

  return { ...state, save, remove }
}
