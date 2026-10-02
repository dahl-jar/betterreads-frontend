import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import bookSeries from '@/testing/mocks/book-series.json'
import { server } from '@/testing/msw-server'

import type { BookSeries } from '../api/getBookSeries'
import { useBookSeries } from '../hooks/useBookSeries'

const BOOKS_BASE = 'http://localhost:8080/api/v1/books'
const RED_RISING_KEY = 'OL26W'
const EMPIRE_OF_SILENCE_KEY = 'OL40W'
const SUN_EATER = { ...bookSeries, name: 'Sun Eater' }

function shownNames(series: BookSeries[]) {
  return series.map((entry) => entry.name)
}

describe('useBookSeries', () => {
  it('should clear the previous series while the next book loads', async () => {
    let markNextSeriesStarted: () => void = () => undefined
    let releaseNextSeries: () => void = () => undefined
    const nextSeriesStarted = new Promise<void>((resolve) => {
      markNextSeriesStarted = resolve
    })
    const heldNextSeries = new Promise<void>((resolve) => {
      releaseNextSeries = resolve
    })
    server.use(
      http.get(`${BOOKS_BASE}/:key/series`, async ({ params }) => {
        if (params.key === RED_RISING_KEY) {
          return HttpResponse.json({ data: [bookSeries] })
        }
        markNextSeriesStarted()
        await heldNextSeries
        return HttpResponse.json({ data: [SUN_EATER] })
      }),
    )
    const { rerender, result } = renderHook(({ bookKey }) => useBookSeries(bookKey), {
      initialProps: { bookKey: RED_RISING_KEY },
    })
    await waitFor(() => expect(shownNames(result.current)).toEqual([bookSeries.name]))

    rerender({ bookKey: EMPIRE_OF_SILENCE_KEY })
    await nextSeriesStarted

    expect(result.current).toEqual([])

    releaseNextSeries()
    await waitFor(() => expect(shownNames(result.current)).toEqual([SUN_EATER.name]))
  })
})
