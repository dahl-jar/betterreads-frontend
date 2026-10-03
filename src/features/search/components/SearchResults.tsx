import { Link } from 'react-router-dom'

import { BookCover } from '@/components/BookCover'
import { GenreBadge } from '@/components/GenreBadge'
import { Skeleton } from '@/components/ui/skeleton'
import type { SearchStatus } from '@/features/search/hooks/useSearch'
import { groupBySeries, positionIn } from '@/features/search/lib/groupBySeries'
import { bookNoun } from '@/lib/bookNoun'
import { bookPath } from '@/lib/bookPath'
import { formatAuthors } from '@/lib/formatAuthors'
import { uniqueSubjects } from '@/lib/subjects'

import type { BookSearchDocument } from '../api/searchBooks'

type SearchResultsProps = {
  status: SearchStatus
  hits: BookSearchDocument[]
  query: string
}

type BookRowProps = {
  hit: BookSearchDocument
  position?: number | undefined
}

const SKELETON_COUNT = 4
const SHOWN_GENRES = 4

export function SearchResults({ status, hits, query }: SearchResultsProps) {
  if (status === 'idle') {
    return null
  }

  if (status === 'loading') {
    return (
      <ul
        className="mt-2 space-y-2"
        role="status"
        aria-label="Loading search results"
        aria-busy="true"
      >
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <li key={index}>
            <Skeleton className="h-16" />
          </li>
        ))}
      </ul>
    )
  }

  if (status === 'error') {
    return (
      <p role="alert" className="mt-3 text-sm text-fg-2">
        Something went wrong searching. Try again in a moment.
      </p>
    )
  }

  if (status === 'staging') {
    return (
      <div role="status" className="mt-3 space-y-1 text-sm text-fg-2">
        <p>
          No match for <span className="font-semibold text-fg">{query}</span> yet. We&apos;re
          checking our sources for it now.
        </p>
        <p className="text-fg-3">
          If a complete copy turns up, it&apos;ll appear here on a later search. Some books
          aren&apos;t in our sources, or only show up with missing details, and those we can&apos;t
          list.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-2">
      {groupBySeries(hits).map((group) =>
        group.kind === 'series' ? (
          <section key={`series:${group.seriesName}`} className="mt-7">
            <div className="flex items-end gap-3 border-b-2 border-accent">
              <h3 className="rounded-t-[4px] bg-accent px-3 pb-0.5 pt-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-on-accent">
                {group.seriesName}
              </h3>
              <span className="pb-1 text-xs text-fg-3">
                {group.books.length} {bookNoun(group.books.length)}
              </span>
            </div>
            <ul className="mt-1.5">
              {group.books.map((book) => (
                <li key={book.bookId}>
                  <BookRow hit={book} position={positionIn(book, group.seriesName)} />
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div key={group.book.bookId} className="mt-1.5">
            <BookRow hit={group.book} />
          </div>
        ),
      )}
    </div>
  )
}

function BookRow({ hit, position }: BookRowProps) {
  return (
    <Link
      to={bookPath(hit.bookId)}
      className="flex items-center gap-4 rounded-[3px] px-3 py-2.5 no-underline hover:bg-sunken"
    >
      <BookCover
        coverUrl={hit.coverUrl}
        title={hit.title}
        className="h-[4.5rem] w-12 shrink-0 rounded-[2px] shadow-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-title text-lg text-fg">{hit.title}</p>
        <p className="flex min-w-0 text-sm text-fg-2">
          <span className="max-w-[42ch] truncate">{formatAuthors(hit.authors)}</span>
          {hit.publicationYear ? (
            <span className="shrink-0">&nbsp;· {hit.publicationYear}</span>
          ) : null}
        </p>
        {hit.subjects.length > 0 ? (
          <p className="mt-1.5 flex flex-wrap gap-1.5">
            {uniqueSubjects(hit.subjects)
              .slice(0, SHOWN_GENRES)
              .map((subject) => (
                <GenreBadge key={subject} label={subject} />
              ))}
          </p>
        ) : null}
      </div>
      {position === undefined ? null : (
        <>
          {' '}
          <span className="shrink-0 text-xs text-fg-3">Book {position}</span>
        </>
      )}
    </Link>
  )
}
