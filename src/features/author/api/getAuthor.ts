import { z } from 'zod'

import { apiGet } from '@/lib/api/client'

const AUTHORS_PATH = '/api/v1/authors'

const authorBookSchema = z.object({
  bookId: z.string(),
  title: z.string(),
  coverUrl: z.string().nullish(),
  firstPublishYear: z.number().int().nullish(),
  seriesName: z.string().nullish(),
  seriesPosition: z.number().nullish(),
  role: z.string(),
})

const authorPageSchema = z.object({
  authorId: z.number().int(),
  name: z.string(),
  photoUrl: z.string().nullish(),
  bio: z.string().nullish(),
  books: z.array(authorBookSchema),
})

export type AuthorBook = z.infer<typeof authorBookSchema>

export type AuthorPage = z.infer<typeof authorPageSchema>

export async function getAuthor(authorId: number, signal?: AbortSignal): Promise<AuthorPage> {
  const raw = await apiGet(`${AUTHORS_PATH}/${authorId}`, signal ? { signal } : {})
  return authorPageSchema.parse(raw)
}
