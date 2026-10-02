import { z } from 'zod'

import { apiGet } from '@/lib/api/client'

const BOOKS_PATH = '/api/v1/books'

const seriesBookSchema = z.object({
  key: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  coverUrl: z.string().nullish(),
  position: z.number().int(),
})

export type SeriesBook = z.infer<typeof seriesBookSchema>

const bookSeriesSchema = z.object({
  name: z.string(),
  position: z.number().int(),
  books: z.array(seriesBookSchema),
})

export type BookSeries = z.infer<typeof bookSeriesSchema>

const bookSeriesListSchema = z.array(bookSeriesSchema)

export async function getBookSeries(key: string, signal?: AbortSignal): Promise<BookSeries[]> {
  const raw = await apiGet(
    `${BOOKS_PATH}/${encodeURIComponent(key)}/series`,
    signal ? { signal } : {},
  )
  return bookSeriesListSchema.parse(raw)
}
