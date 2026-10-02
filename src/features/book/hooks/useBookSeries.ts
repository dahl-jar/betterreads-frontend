import { useEffect, useState } from 'react'

import { getBookSeries, type BookSeries } from '../api/getBookSeries'

const NO_SERIES: BookSeries[] = []

export function useBookSeries(key: string): BookSeries[] {
  const [result, setResult] = useState<{
    key: string
    series: BookSeries[]
  }>({ key: '', series: NO_SERIES })

  useEffect(() => {
    const controller = new AbortController()
    getBookSeries(key, controller.signal)
      .then((series) => {
        if (!controller.signal.aborted) {
          setResult({ key, series })
        }
      })
      .catch(() => undefined)
    return () => controller.abort()
  }, [key])

  return result.key === key ? result.series : NO_SERIES
}
