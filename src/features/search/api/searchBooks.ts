import { z } from 'zod'

import { apiGetPaged } from '@/lib/api/client'
import { seriesSchema } from '@/lib/series'

const SEARCH_BOOKS_PATH = '/api/v1/search/books'

export const bookSearchDocumentSchema = z.object({
  bookId: z.string(),
  title: z.string(),
  subtitle: z.string().nullish(),
  seriesName: z.string().nullish(),
  seriesPosition: z.number().nullish(),
  series: seriesSchema.optional(),
  authors: z.array(z.string()),
  subjects: z.array(z.string()),
  language: z.string().nullish(),
  coverUrl: z.string().nullish(),
  publicationYear: z.number().int().nullish(),
  popularityScore: z.number(),
})

export type BookSearchDocument = z.infer<typeof bookSearchDocumentSchema>

export type BookSearchResult = {
  hits: BookSearchDocument[]
  totalHits: number
  offset: number
  limit: number
}

const searchHitsSchema = z.array(bookSearchDocumentSchema)

type SearchBooksParams = {
  query: string
  offset?: number
  limit?: number
  signal?: AbortSignal
}

export async function searchBooks({
  query,
  offset = 0,
  limit = 20,
  signal,
}: SearchBooksParams): Promise<BookSearchResult> {
  const search = new URLSearchParams({
    q: query,
    offset: String(offset),
    limit: String(limit),
  })
  const page = await apiGetPaged(
    `${SEARCH_BOOKS_PATH}?${search.toString()}`,
    signal ? { signal } : {},
  )
  return {
    hits: searchHitsSchema.parse(page.data),
    totalHits: page.meta.total,
    offset: page.meta.offset,
    limit: page.meta.limit,
  }
}
