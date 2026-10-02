import { type ReactNode } from 'react'

import { StarRating } from '@/components/StarRating'
import { uniqueSubjects } from '@/lib/subjects'

import { type BookDetail as BookDetailData } from '../api/getBook'

import { SeriesLinks } from './SeriesLinks'
import { ShowMoreText } from './ShowMoreText'

type BookDetailProps = {
  book: BookDetailData
  rating?: Rating | undefined
  shelfControl?: ReactNode
  activity?: ReactNode
}

type Rating = {
  average: number | null | undefined
  count: number | null | undefined
}

const LANGUAGE_NAMES = new Intl.DisplayNames(undefined, { type: 'language' })

export function BookDetail({ book, rating, shelfControl, activity }: BookDetailProps) {
  const displayedRating = rating ?? { average: book.averageRating, count: book.ratingCount }

  const details = [
    book.pageCount ? `${book.pageCount} ${book.pageCount === 1 ? 'page' : 'pages'}` : undefined,
    book.firstPublishYear ? `First published ${book.firstPublishYear}` : undefined,
    book.isbn ? `ISBN ${book.isbn}` : undefined,
  ].filter(Boolean)
  const language = book.language
    ? `Language: ${LANGUAGE_NAMES.of(book.language) ?? book.language}`
    : undefined

  return (
    <article className="grid gap-10 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-14">
      <div className="flex flex-col items-center md:block md:sticky md:top-8 md:self-start">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            width={256}
            height={384}
            className="w-64 rounded-md border border-line object-cover shadow-card"
          />
        ) : (
          <div className="flex aspect-[2/3] w-64 items-center justify-center rounded-md border border-line bg-muted text-sm text-ink-faint">
            No cover
          </div>
        )}
        <div className="mt-4 w-64">{shelfControl}</div>
      </div>

      <div className="min-w-0">
        <SeriesLinks book={book} />
        <h1 className="font-display text-4xl font-semibold leading-tight text-ink">{book.title}</h1>
        {book.subtitle ? <p className="mt-1 text-lg text-ink-soft">{book.subtitle}</p> : null}
        <p className="mt-2 text-ink-soft">
          {book.authors.length > 0 ? book.authors.join(', ') : 'Author unknown'}
        </p>

        {displayedRating.average !== undefined && displayedRating.average !== null ? (
          <p className="mt-3 flex items-center gap-2">
            <StarRating value={displayedRating.average} />
            <span className="text-2xl font-semibold text-ink">
              {displayedRating.average.toFixed(2)}
            </span>
            {displayedRating.count ? (
              <span className="text-sm text-ink-soft">
                {displayedRating.count.toLocaleString()}{' '}
                {displayedRating.count === 1 ? 'rating' : 'ratings'}
              </span>
            ) : null}
          </p>
        ) : null}

        {book.description ? (
          <div className="mt-5 max-w-2xl">
            <ShowMoreText
              text={book.description}
              className="whitespace-pre-line leading-relaxed text-ink"
            />
          </div>
        ) : null}

        {book.subjects.length > 0 ? (
          <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
            <span className="text-sm text-ink-faint">Genres</span>
            {uniqueSubjects(book.subjects)
              .slice(0, 8)
              .map((subject) => (
                <span key={subject} className="text-sm font-semibold text-green">
                  {subject}
                </span>
              ))}
          </p>
        ) : null}

        {details.length > 0 || language ? (
          <p className="mt-4 text-sm text-ink-soft">
            {details.join(' · ')}
            {details.length > 0 && language ? ' · ' : null}
            {language ? <span>{language}</span> : null}
          </p>
        ) : null}

        {book.awards.length > 0 ? (
          <div className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Awards</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-ink-soft">
              {book.awards.map((award) => (
                <li key={award}>{award}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {!book.complete ? (
          <p
            role="status"
            className="mt-8 rounded-md border border-line bg-muted/40 px-4 py-3 text-sm text-ink-soft"
          >
            We&apos;re still gathering the full details for this book. More sections fill in as they
            arrive.
          </p>
        ) : null}

        {activity}
      </div>
    </article>
  )
}
