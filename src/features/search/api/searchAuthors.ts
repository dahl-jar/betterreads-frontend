import { z } from 'zod'

import { apiGetPaged } from '@/lib/api/client'

const SEARCH_AUTHORS_PATH = '/api/v1/search/authors'

const authorSearchDocumentSchema = z.object({
  authorId: z.number().int(),
  name: z.string(),
  aliases: z.array(z.string()),
  photoUrl: z.string().nullish(),
  bookCount: z.number().int(),
  popularityScore: z.number(),
  topTitles: z.array(z.string()),
})

export type AuthorSearchDocument = z.infer<typeof authorSearchDocumentSchema>

const authorHitsSchema = z.array(authorSearchDocumentSchema)

type SearchAuthorsParams = {
  query: string
  limit?: number
  signal?: AbortSignal
}

export async function searchAuthors({
  query,
  limit = 20,
  signal,
}: SearchAuthorsParams): Promise<AuthorSearchDocument[]> {
  const search = new URLSearchParams({ q: query, limit: String(limit) })
  const page = await apiGetPaged(
    `${SEARCH_AUTHORS_PATH}?${search.toString()}`,
    signal ? { signal } : {},
  )
  return authorHitsSchema.parse(page.data)
}
