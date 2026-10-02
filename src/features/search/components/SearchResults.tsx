import { Link } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import type { SearchStatus } from '@/features/search/hooks/useSearch'
import { groupBySeries } from '@/features/search/lib/groupBySeries'
import { uniqueSubjects } from '@/lib/subjects'

import type { BookSearchDocument } from '../api/searchBooks'

type SearchResultsProps = {
  status: SearchStatus
  hits: BookSearchDocument[]
  query: string
}

function BookCover({ coverUrl, title }: { coverUrl?: string | undefined; title: string }) {
  if (coverUrl === undefined) {
    return (
      <div
        aria-hidden="true"
        className="flex h-[72px] w-12 shrink-0 items-center justify-center rounded border border-line bg-muted/40 text-lg font-semibold text-ink-faint"
      >
        {title.charAt(0).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={coverUrl}
      alt=""
      loading="lazy"
      className="h-[72px] w-12 shrink-0 rounded border border-line object-cover"
    />
  )
}

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
        {Array.from({ length: 4 }).map((_, index) => (
          <li key={index}>
            <Skeleton className="h-16" />
          </li>
        ))}
      </ul>
    )
  }

  if (status === 'error') {
    return (
      <p role="alert" className="mt-3 text-sm text-ink-soft">
        Something went wrong searching. Try again in a moment.
      </p>
    )
  }

  if (status === 'staging') {
    return (
      <div role="status" className="mt-3 space-y-1 text-sm text-ink-soft">
        <p>
          No match for <span className="font-semibold text-ink">{query}</span> yet. We&apos;re
          checking our sources for it now.
        </p>
        <p className="text-ink-faint">
          If a complete copy turns up, it&apos;ll appear here on a later search. Some books
          aren&apos;t in our sources, or only show up with missing details, and those we can&apos;t
          list.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-line">
      {groupBySeries(hits).map((group) =>
        group.kind === 'series' ? (
          <section key={`series:${group.seriesName}`} className="py-3">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {group.seriesName} series
            </h3>
            <ul className="border-l border-line pl-4">
              {group.books.map((book) => (
                <li key={book.bookId}>
                  <BookRow hit={book} />
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <BookRow key={group.book.bookId} hit={group.book} />
        ),
      )}
    </div>
  )
}

function BookRow({ hit }: { hit: BookSearchDocument }) {
  return (
    <Link to={`/books/${hit.bookId}`} className="flex gap-4 py-4 no-underline group">
      <BookCover coverUrl={hit.coverUrl ?? undefined} title={hit.title} />
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-semibold text-ink group-hover:text-green">
          {hit.title}
        </p>
        {hit.subtitle ? <p className="text-sm text-ink-soft">{hit.subtitle}</p> : null}
        <p className="mt-0.5 text-sm text-ink-soft">
          {hit.authors.length > 0 ? `by ${hit.authors.join(', ')}` : 'Author unknown'}
          {hit.publicationYear ? (
            <span className="text-ink-faint"> · {hit.publicationYear}</span>
          ) : null}
        </p>
        {hit.subjects.length > 0 ? (
          <p className="mt-1.5 flex flex-wrap gap-1.5">
            {uniqueSubjects(hit.subjects)
              .slice(0, 4)
              .map((subject) => (
                <span
                  key={subject}
                  className="rounded border border-line px-2 py-0.5 text-xs text-ink-faint"
                >
                  {subject}
                </span>
              ))}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
