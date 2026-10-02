import { Link } from 'react-router-dom'

import { BookCover } from '@/components/BookCover'
import { SlideRow } from '@/components/SlideRow'

import { type BookDetail } from '../api/getBook'
import { type BookSeries, type SeriesBook } from '../api/getBookSeries'

type SeriesRowsProps = {
  book: BookDetail
  series: BookSeries[]
}

type SeriesBookCardProps = {
  book: SeriesBook
  open: boolean
}

function booksInOrder(openBook: BookDetail, entry: BookSeries): SeriesBook[] {
  const open: SeriesBook = {
    key: openBook.key,
    title: openBook.title,
    authors: openBook.authors,
    coverUrl: openBook.coverUrl,
    position: entry.position,
  }
  return [open, ...entry.books].sort((first, second) => first.position - second.position)
}

function SeriesBookCard({ book, open }: SeriesBookCardProps) {
  const author = book.authors[0]
  const card = (
    <>
      <BookCover
        coverUrl={book.coverUrl}
        title={book.title}
        className="aspect-[2/3] w-full rounded-[3px] shadow-cover"
      />
      <p className="mt-2.5 text-xs text-fg-3">Book {book.position}</p>
      <p className="mt-0.5 line-clamp-2 font-title text-sm leading-snug text-fg group-hover:text-brand">
        {book.title}
      </p>
      {author ? <p className="mt-0.5 truncate text-xs text-fg-3">{author}</p> : null}
    </>
  )

  return (
    <li aria-current={open ? 'true' : undefined} className="w-28 shrink-0 snap-start">
      {open ? (
        card
      ) : (
        <Link to={`/books/${book.key}`} className="group block no-underline">
          {card}
        </Link>
      )}
    </li>
  )
}

export function SeriesRows({ book, series }: SeriesRowsProps) {
  const rows = series.filter((entry) => entry.books.length > 0)
  if (rows.length === 0) {
    return null
  }

  return (
    <div className="mt-12 flex flex-col divide-y divide-rule">
      {rows.map((entry) => {
        const books = booksInOrder(book, entry)
        return (
          <div key={entry.name} className="py-8 first:pt-0 last:pb-0">
            <SlideRow
              title={`Also in ${entry.name}`}
              heading={
                <>
                  Also in <span className="text-brand">{entry.name}</span>
                </>
              }
              itemCount={books.length}
            >
              {books.map((seriesBook) => (
                <SeriesBookCard
                  key={seriesBook.key}
                  book={seriesBook}
                  open={seriesBook.key === book.key}
                />
              ))}
            </SlideRow>
          </div>
        )
      })}
    </div>
  )
}
