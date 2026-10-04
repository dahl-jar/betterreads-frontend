import { type ReactNode } from 'react'

export type ReviewWindowBook = {
  key: string
  title: string
  coverUrl?: string | null | undefined
}

type ReviewWindowReview = {
  id: number
  author: string
  rating?: number | null | undefined
  title?: string | null | undefined
  body?: string | null | undefined
  createdAt: string
  readStartedAt?: string | null | undefined
  readFinishedAt?: string | null | undefined
}

export type ReviewWindowItem = {
  review: ReviewWindowReview
  book: ReviewWindowBook
}

export type ReviewSection = 'comments'

export type RenderComments = (reviewId: number) => ReactNode

export type OpenReview = (reviewId: number, section?: ReviewSection) => void
