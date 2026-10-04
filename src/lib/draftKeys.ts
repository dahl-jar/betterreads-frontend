type DraftKind = 'review' | 'comment' | 'reply'

const REVIEW_PREFIX = 'review:'
const REPLY_PREFIX = 'reply:'

export function reviewDraftKey(bookKey: string): string {
  return `${REVIEW_PREFIX}${bookKey}`
}

export function reviewCommentDraftKey(reviewId: number): string {
  return `review-comment:${reviewId}`
}

export function bookCommentDraftKey(bookKey: string): string {
  return `book-comment:${bookKey}`
}

export function replyDraftKey(commentId: number): string {
  return `${REPLY_PREFIX}${commentId}`
}

export function draftKindOf(keys: readonly string[]): DraftKind {
  if (keys.some((key) => key.startsWith(REVIEW_PREFIX))) {
    return 'review'
  }
  return keys.every((key) => key.startsWith(REPLY_PREFIX)) ? 'reply' : 'comment'
}
