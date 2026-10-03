import { useOptimistic, useState, useTransition } from 'react'

const RATING_FAILED = 'Could not save your rating. Try again.'

type ShelfRating = {
  rating: number
  error: string | undefined
  rate: (rating: number) => void
}

export function useShelfRating(
  saved: number,
  onRate: (rating: number) => Promise<void>,
): ShelfRating {
  const [rating, showRating] = useOptimistic(saved)
  const [error, setError] = useState<string | undefined>(undefined)
  const [, startTransition] = useTransition()

  const rate = (next: number) => {
    setError(undefined)
    startTransition(async () => {
      showRating(next)
      try {
        await onRate(next)
      } catch {
        setError(RATING_FAILED)
      }
    })
  }

  return { rating, error, rate }
}
