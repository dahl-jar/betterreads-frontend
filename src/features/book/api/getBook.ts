import { z } from 'zod'

import { apiGet } from '@/lib/api/client'
import { seriesSchema } from '@/lib/series'

const BOOKS_PATH = '/api/v1/books'

const contributorSchema = z.object({
  authorId: z.number().int(),
  name: z.string(),
  role: z.string(),
})

export type Contributor = z.infer<typeof contributorSchema>

export const bookDetailSchema = z.object({
  key: z.string(),
  complete: z.boolean(),
  title: z.string(),
  subtitle: z.string().nullish(),
  authors: z.array(z.string()),
  contributors: z.array(contributorSchema),
  description: z.string().nullish(),
  coverUrl: z.string().nullish(),
  appleBooksUrl: z.string().nullish(),
  firstPublishYear: z.number().int().nullish(),
  isbn: z.string().nullish(),
  pageCount: z.number().int().nullish(),
  language: z.string().nullish(),
  averageRating: z.number().nullish(),
  ratingCount: z.number().int().nullish(),
  seriesName: z.string().nullish(),
  seriesPosition: z.number().nullish(),
  series: seriesSchema.optional(),
  subjects: z.array(z.string()),
  awards: z.array(z.string()),
})

export type BookDetail = z.infer<typeof bookDetailSchema>

export async function getBook(key: string, signal?: AbortSignal): Promise<BookDetail> {
  const raw = await apiGet(`${BOOKS_PATH}/${encodeURIComponent(key)}`, signal ? { signal } : {})
  return bookDetailSchema.parse(raw)
}
