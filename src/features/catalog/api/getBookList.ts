import { z } from 'zod'

import { apiGet } from '@/lib/api/client'

const BOOKS_PATH = '/api/v1/books'

export type BookListType = 'RECENTLY_ADDED' | 'TOP_RATED'

export const bookCardSchema = z.object({
  key: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  coverUrl: z.string().nullish(),
  firstPublishYear: z.number().int().nullish(),
  averageRating: z.number().nullish(),
  ratingCount: z.number().int().nullish(),
})

export type BookCard = z.infer<typeof bookCardSchema>

const bookCardsSchema = z.array(bookCardSchema)

const LIST_SIZE = 20

export async function getBookList(list: BookListType, signal?: AbortSignal): Promise<BookCard[]> {
  const search = new URLSearchParams({ list, limit: String(LIST_SIZE) })
  const raw = await apiGet(`${BOOKS_PATH}?${search.toString()}`, signal ? { signal } : {})
  return bookCardsSchema.parse(raw)
}
