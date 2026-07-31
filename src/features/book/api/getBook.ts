import { z } from 'zod'

import { apiGet } from '@/lib/api/client'

const BOOKS_PATH = '/api/v1/books'

export const bookDetailSchema = z.object({
  key: z.string(),
  complete: z.boolean(),
  title: z.string(),
  subtitle: z.string().nullish(),
  authors: z.array(z.string()),
  description: z.string().nullish(),
  coverUrl: z.string().nullish(),
  firstPublishYear: z.number().int().nullish(),
  isbn: z.string().nullish(),
  pageCount: z.number().int().nullish(),
  language: z.string().nullish(),
  averageRating: z.number().nullish(),
  ratingCount: z.number().int().nullish(),
  seriesName: z.string().nullish(),
  seriesPosition: z.number().int().nullish(),
  subjects: z.array(z.string()),
  awards: z.array(z.string()),
})

export type BookDetail = z.infer<typeof bookDetailSchema>

export async function getBook(key: string, signal?: AbortSignal): Promise<BookDetail> {
  const raw = await apiGet(`${BOOKS_PATH}/${encodeURIComponent(key)}`, signal ? { signal } : {})
  return bookDetailSchema.parse(raw)
}
