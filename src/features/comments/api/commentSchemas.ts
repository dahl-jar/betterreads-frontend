import { z } from 'zod'

export const COMMENT_BODY_MAX = 5000

export const commentSchema = z.object({
  id: z.number().int(),
  body: z.string(),
  author: z.string(),
  createdAt: z.string(),
  replyCount: z.number().int(),
})

export type Comment = z.infer<typeof commentSchema>

export const commentsSchema = z.array(commentSchema)

export type CommentPage = {
  comments: Comment[]
  total: number
  offset: number
  limit: number
}

export type CreateCommentInput = {
  body: string
  parentCommentId?: number
}
