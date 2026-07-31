import { z } from 'zod'

export const readingStatusSchema = z.enum([
  'WANT_TO_READ',
  'CURRENTLY_READING',
  'FINISHED',
  'DROPPED',
])

export type ReadingStatus = z.infer<typeof readingStatusSchema>

export const shelfEntrySchema = z.object({
  key: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  coverUrl: z.string().nullish(),
  status: readingStatusSchema,
  favorite: z.boolean(),
  addedAt: z.string(),
  startedAt: z.string().nullish(),
  finishedAt: z.string().nullish(),
  notes: z.string().nullish(),
  averageRating: z.number().nullish(),
  myRating: z.number().nullish(),
})

export type ShelfEntry = z.infer<typeof shelfEntrySchema>

export const shelfSchema = z.array(shelfEntrySchema)
