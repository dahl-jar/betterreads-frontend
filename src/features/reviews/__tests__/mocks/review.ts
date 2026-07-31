import review from './review.json'

export function makeReview(overrides: Record<string, unknown> = {}) {
  return { ...review, ...overrides }
}
