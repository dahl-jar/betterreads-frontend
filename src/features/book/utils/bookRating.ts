import { type BookDetail } from '../api/getBook'
import { type Rating } from '../components/RatingPair'

export function bookRating(book: BookDetail): Rating | undefined {
  if (book.averageRating === null || book.averageRating === undefined) {
    return undefined
  }
  return { average: book.averageRating, count: book.ratingCount ?? 0 }
}
