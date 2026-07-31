import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Pagination } from '@/components/Pagination'

import { type ReadingStatus, type ShelfEntry } from '../api/shelfSchemas'
import { useShelf } from '../hooks/useShelf'
import { formatShelfDate } from '../utils/formatShelfDate'

const MAX_STARS = 5
const SHELF_PAGE_SIZE = 15

const FILTERS: { value: ReadingStatus | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'WANT_TO_READ', label: 'Want to read' },
  { value: 'CURRENTLY_READING', label: 'Reading' },
  { value: 'FINISHED', label: 'Finished' },
  { value: 'DROPPED', label: 'Dropped' },
]

export function ShelfList() {
  const [filter, setFilter] = useState<ReadingStatus | undefined>(undefined)
  const [page, setPage] = useState(1)
  const { status, entries } = useShelf(filter)
  const pageStart = (page - 1) * SHELF_PAGE_SIZE
  const visibleEntries = entries.slice(pageStart, pageStart + SHELF_PAGE_SIZE)
  const hasNextPage = page * SHELF_PAGE_SIZE < entries.length

  const selectFilter = (nextFilter: ReadingStatus | undefined) => {
    setFilter(nextFilter)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => {
          const active = filter === option.value
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => selectFilter(option.value)}
              aria-pressed={active}
              className={
                active
                  ? 'rounded-full bg-green px-4 py-1.5 text-sm font-semibold text-white'
                  : 'rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink-soft hover:bg-muted'
              }
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {status === 'error' ? (
        <p role="alert" className="text-sm text-destructive">
          Could not load your shelf. Try again.
        </p>
      ) : null}

      {status === 'success' && entries.length === 0 ? (
        <p className="text-ink-soft">No books on this shelf yet.</p>
      ) : null}

      <ul className="divide-y divide-line">
        {visibleEntries.map((entry) => (
          <li key={entry.key}>
            <Link to={`/books/${entry.key}`} className="flex gap-4 py-4 no-underline group">
              {entry.coverUrl ? (
                <img
                  src={entry.coverUrl}
                  alt=""
                  width={64}
                  height={96}
                  className="h-24 w-16 rounded border border-line object-cover"
                />
              ) : (
                <div className="flex h-24 w-16 items-center justify-center rounded border border-line bg-muted text-xs text-ink-faint">
                  No cover
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-semibold text-ink group-hover:text-green">
                  {entry.title}
                  {entry.favorite ? (
                    <>
                      <span className="ml-2 text-rust" aria-hidden="true">
                        ★
                      </span>
                      <span className="sr-only"> Favorite</span>
                    </>
                  ) : null}
                </p>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {entry.authors.length > 0 ? `by ${entry.authors.join(', ')}` : 'Author unknown'}
                </p>
                <ShelfEntryMeta entry={entry} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {status === 'success' ? (
        <Pagination
          page={page}
          hasNext={hasNextPage}
          ariaLabel="Shelf pages"
          onPageChange={setPage}
        />
      ) : null}
    </div>
  )
}

function ShelfEntryMeta({ entry }: { entry: ShelfEntry }) {
  const addedAt = formatShelfDate(entry.addedAt)
  const finishedAt = entry.status === 'FINISHED' ? formatShelfDate(entry.finishedAt) : undefined
  const averageRating = entry.averageRating ?? undefined
  const myRating = entry.myRating ?? undefined

  return (
    <div className="mt-1.5 flex flex-col gap-1 text-sm text-ink-faint">
      <ShelfDateLine addedAt={addedAt} finishedAt={finishedAt} />
      <ShelfRatingLine averageRating={averageRating} myRating={myRating} />
    </div>
  )
}

function ShelfDateLine({
  addedAt,
  finishedAt,
}: {
  addedAt: string | undefined
  finishedAt: string | undefined
}) {
  if (!addedAt && !finishedAt) {
    return null
  }

  return (
    <p className="flex flex-wrap gap-x-3">
      {addedAt ? <span>Added {addedAt}</span> : null}
      {finishedAt ? <span>Read {finishedAt}</span> : null}
    </p>
  )
}

function ShelfRatingLine({
  averageRating,
  myRating,
}: {
  averageRating: number | undefined
  myRating: number | undefined
}) {
  if (averageRating === undefined && myRating === undefined) {
    return null
  }

  return (
    <p className="flex flex-wrap items-center gap-x-3">
      {averageRating !== undefined ? (
        <span>
          <span className="text-rust">★</span> {averageRating.toFixed(2)} avg
        </span>
      ) : null}
      {myRating !== undefined ? <StarRating value={myRating} /> : null}
    </p>
  )
}

function StarRating({ value }: { value: number }) {
  return (
    <span aria-label={`Your rating: ${value} of ${MAX_STARS}`} className="text-rust">
      {'★'.repeat(value)}
      <span className="text-ink-faint">{'☆'.repeat(Math.max(0, MAX_STARS - value))}</span>
    </span>
  )
}
