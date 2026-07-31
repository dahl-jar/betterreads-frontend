import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { getBook } from '@/features/book/api/getBook'
import { BookDetail } from '@/features/book/components/BookDetail'
import { useBook } from '@/features/book/hooks/useBook'
import { ShelfControl } from '@/features/shelf/components/ShelfControl'

import { BookActivity } from '../components/BookActivity'
import { useDocumentTitle } from '../useDocumentTitle'

import { NotFoundRoute } from './NotFoundRoute'

export function BookRoute() {
  const { key = '' } = useParams<{ key: string }>()
  const { status, book } = useBook(key)
  const [rating, setRating] = useState<
    { average: number | null | undefined; count: number | null | undefined } | undefined
  >(undefined)
  useDocumentTitle(book?.title ?? (status === 'notFound' ? 'Book not found' : 'Book'))

  function refreshRating() {
    getBook(key)
      .then((fresh) => setRating({ average: fresh.averageRating, count: fresh.ratingCount }))
      .catch(() => undefined)
  }

  if (status === 'notFound') {
    return <NotFoundRoute subject="book" />
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      {status === 'loading' ? <BookDetailSkeleton /> : null}
      {status === 'error' ? (
        <p role="alert" className="text-ink-soft">
          Something went wrong loading this book. Try again in a moment.
        </p>
      ) : null}
      {status === 'success' && book ? (
        <BookDetail
          book={book}
          rating={rating}
          shelfControl={<ShelfControl bookKey={book.key} />}
          activity={<BookActivity bookKey={book.key} onReviewChange={refreshRating} />}
        />
      ) : null}
    </main>
  )
}

function BookDetailSkeleton() {
  return (
    <div
      className="flex flex-col gap-8 md:flex-row"
      role="status"
      aria-label="Loading book"
      aria-busy="true"
    >
      <Skeleton className="h-[270px] w-[180px] shrink-0" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-6 h-24 w-full" />
      </div>
    </div>
  )
}
