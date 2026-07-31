import { useEffect, useState } from 'react'

import { getCommunityRating, type CommunityRating } from '../api/getCommunityRating'

export function useCommunityRating(
  bookKey: string,
  refreshToken: number,
): CommunityRating | undefined {
  const requestKey = `${bookKey}:${refreshToken}`
  const [result, setResult] = useState<{
    requestKey: string
    rating: CommunityRating | undefined
  }>({ requestKey: '', rating: undefined })

  useEffect(() => {
    const controller = new AbortController()
    getCommunityRating(bookKey, controller.signal)
      .then((nextRating) => {
        if (!controller.signal.aborted) {
          setResult({ requestKey, rating: nextRating })
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setResult({ requestKey, rating: undefined })
        }
      })
    return () => controller.abort()
  }, [bookKey, requestKey])

  return result.requestKey === requestKey ? result.rating : undefined
}
