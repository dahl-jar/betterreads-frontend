import { z } from 'zod'

export const REVIEW_TITLE_MAX = 255
export const REVIEW_BODY_MAX = 5000

export const reviewSchema = z.object({
  id: z.number().int(),
  bookKey: z.string(),
  rating: z.number().int().nullish(),
  title: z.string().nullish(),
  body: z.string().nullish(),
  createdAt: z.string(),
  author: z.string(),
  commentCount: z.number().int(),
})

export type Review = z.infer<typeof reviewSchema>

export const reviewsSchema = z.array(reviewSchema)

export type ReviewPage = {
  reviews: Review[]
  total: number
  offset: number
  limit: number
}

export type UpsertReviewInput = {
  rating: number
  title?: string
  body?: string
}
