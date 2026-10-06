import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { getBook, type BookDetail as BookDetailData } from '@/features/book/api/getBook'
import { BookDetail, BookDetailSkeleton } from '@/features/book/components/BookDetail'
import { BookFacts, type Stamp } from '@/features/book/components/BookFacts'
import { type Rating } from '@/features/book/components/RatingPair'
import { SeriesRows } from '@/features/book/components/SeriesRows'
import { useBook } from '@/features/book/hooks/useBook'
import { useBookSeries } from '@/features/book/hooks/useBookSeries'
import { bookRating } from '@/features/book/utils/bookRating'
import { CommunityRatingSummary } from '@/features/reviews/components/CommunityRatingSummary'
import { useCommunityRating } from '@/features/reviews/hooks/useCommunityRating'
import { type ReadingStatus, type ShelfEntry } from '@/features/shelf/api/shelfSchemas'
import { ShelfControl } from '@/features/shelf/components/ShelfControl'
import { useShelfCounts } from '@/features/shelf/hooks/useShelfCounts'
import { READING_STATUS_LABELS } from '@/features/shelf/utils/readingStatusLabels'
import { shelfDateOf } from '@/features/shelf/utils/shelfDateOf'
import { authorPath } from '@/lib/authorPath'

import { BookActivity } from '../components/BookActivity'
import { BookStats } from '../components/BookStats'
import { searchPath } from '../searchPath'
import { useDocumentTitle } from '../useDocumentTitle'

import { NotFoundRoute } from './NotFoundRoute'

const STATUS_TONES: Record<ReadingStatus, Stamp['tone']> = {
  WANT_TO_READ: 'brand',
  CURRENTLY_READING: 'brand',
  FINISHED: 'read',
  DROPPED: 'dropped',
}

type ShelfReport = {
  entry: ShelfEntry | undefined
  statusChanged: boolean
}

function stampOf(entry: ShelfEntry, pressed: boolean): Stamp {
  return {
    label: READING_STATUS_LABELS[entry.status],
    date: shelfDateOf(entry),
    tone: STATUS_TONES[entry.status],
    pressed,
  }
}

export function BookRoute() {
  const { key = '' } = useParams<{ key: string }>()
  const { status, book } = useBook(key)
  useDocumentTitle(book?.title ?? (status === 'notFound' ? 'Book not found' : 'Book'))

  if (status === 'notFound') {
    return <NotFoundRoute subject="book" />
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 lg:py-12">
      {status === 'loading' ? <BookDetailSkeleton /> : null}
      {status === 'error' ? (
        <p role="alert" className="text-fg-2">
          Something went wrong loading this book. Try again in a moment.
        </p>
      ) : null}
      {status === 'success' && book ? <BookPage key={book.key} book={book} /> : null}
    </main>
  )
}

function BookPage({ book }: { book: BookDetailData }) {
  const [hardcoverRating, setHardcoverRating] = useState<Rating | undefined>(undefined)
  const [ratingRefresh, setRatingRefresh] = useState(0)
  const [reviewTotal, setReviewTotal] = useState<number | undefined>(undefined)
  const [shelf, setShelf] = useState<ShelfReport | undefined>(undefined)
  const communityRating = useCommunityRating(book.key, ratingRefresh)
  const shelfCounts = useShelfCounts(book.key)
  const series = useBookSeries(book.key)

  function recordShelfEntry(entry: ShelfEntry | undefined) {
    setShelf((previous) => ({
      entry,
      statusChanged: previous !== undefined && previous.entry?.status !== entry?.status,
    }))
  }

  function refreshRatings() {
    setRatingRefresh((token) => token + 1)
    getBook(book.key)
      .then((fresh) => setHardcoverRating(bookRating(fresh)))
      .catch(() => undefined)
  }

  return (
    <>
      <BookDetail
        book={book}
        seriesHref={searchPath}
        authorHref={authorPath}
        hardcoverRating={hardcoverRating}
        communityRating={
          typeof communityRating?.average === 'number'
            ? { average: communityRating.average, count: communityRating.count }
            : undefined
        }
        shelfControl={<ShelfControl bookKey={book.key} onEntryChange={recordShelfEntry} />}
        facts={
          <BookFacts
            book={book}
            seriesHref={searchPath}
            stamp={shelf?.entry ? stampOf(shelf.entry, shelf.statusChanged) : undefined}
          />
        }
        ratingBars={communityRating ? <CommunityRatingSummary rating={communityRating} /> : null}
      />
      <SeriesRows book={book} series={series} />
      <section className="mt-4 lg:mt-8">
        {shelfCounts && reviewTotal !== undefined ? (
          <BookStats reviewTotal={reviewTotal} counts={shelfCounts} />
        ) : null}
        <BookActivity book={book} onReviewChange={refreshRatings} onTotalChange={setReviewTotal} />
      </section>
    </>
  )
}
