import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import bookSeries from '@/testing/mocks/book-series.json'
import { server } from '@/testing/msw-server'

import { getBookSeries } from '../api/getBookSeries'

const RED_RISING_KEY = 'OL26W'
const SERIES_URL = `http://localhost:8080/api/v1/books/${RED_RISING_KEY}/series`

const [goldenSon] = bookSeries.books

function stubSeries(series: unknown[]) {
  server.use(http.get(SERIES_URL, () => HttpResponse.json({ data: series })))
}

function without(source: Record<string, unknown>, field: string) {
  return Object.fromEntries(Object.entries(source).filter(([name]) => name !== field))
}

describe('getBookSeries', () => {
  it('should return the parsed series', async () => {
    stubSeries([bookSeries])

    const series = await getBookSeries(RED_RISING_KEY)

    expect(series).toEqual([bookSeries])
  })

  it('should parse a book with no cover', async () => {
    const coverless = { ...bookSeries, books: [without(goldenSon!, 'coverUrl')] }
    stubSeries([coverless])

    const series = await getBookSeries(RED_RISING_KEY)

    expect(series).toEqual([coverless])
  })

  it('should parse decimal positions', async () => {
    const decimal = { ...bookSeries, position: 0.5, books: [{ ...goldenSon!, position: 2.5 }] }
    stubSeries([decimal])

    const series = await getBookSeries(RED_RISING_KEY)

    expect(series).toEqual([decimal])
  })

  it('should reject a series book with no key', async () => {
    stubSeries([{ ...bookSeries, books: [without(goldenSon!, 'key')] }])

    await expect(getBookSeries(RED_RISING_KEY)).rejects.toBeInstanceOf(ZodError)
  })
})
