import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { BookCover } from '@/components/BookCover'
import { SlideRow } from '@/components/SlideRow'
import { StarRating } from '@/components/StarRating'
import { bookPath } from '@/lib/bookPath'
import { formatAuthors } from '@/lib/formatAuthors'

import { type ShelfEntry } from '../api/shelfSchemas'
import { formatShelfDate } from '../utils/formatShelfDate'
import { READING_STATUS_LABELS } from '../utils/readingStatusLabels'
import { SHELF_SORTS } from '../utils/shelfSorts'

export function ProfileShelves({ entries }: { entries: ShelfEntry[] }) {
  const reading = entries.filter((entry) => entry.status === 'CURRENTLY_READING')
  const favorites = entries.filter((entry) => entry.favorite)
  const read = entries.filter((entry) => entry.status === 'FINISHED').sort(SHELF_SORTS.read.compare)

  return (
    <div className="mt-8 flex flex-col divide-y divide-rule border-t border-rule">
      {reading.length > 0 ? (
        <section aria-label="Currently reading" className="py-8">
          <h2 className="label-caps">Currently reading</h2>
          <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reading.map((entry) => (
              <CurrentlyReadingItem key={entry.key} entry={entry} />
            ))}
          </ul>
        </section>
      ) : null}
      <ProfileShelfRow
        title="Favorites"
        entries={favorites}
        labelOf={(entry) => READING_STATUS_LABELS[entry.status]}
      />
      <ProfileShelfRow
        title="Recently read"
        entries={read}
        labelOf={(entry) =>
          entry.myRating ? (
            <StarRating value={entry.myRating} size="sm" />
          ) : (
            formatShelfDate(entry.finishedAt)
          )
        }
      />
    </div>
  )
}

function CurrentlyReadingItem({ entry }: { entry: ShelfEntry }) {
  return (
    <li>
      <Link to={bookPath(entry.key)} className="group flex gap-4 no-underline">
        <BookCover
          coverUrl={entry.coverUrl}
          title={entry.title}
          className="h-28 w-[4.6rem] shrink-0 rounded-[3px] shadow-cover"
        />
        <div className="min-w-0 self-center">
          <p className="font-title text-base font-bold leading-snug text-fg group-hover:text-brand">
            {entry.title}
          </p>
          <p className="mt-0.5 text-sm text-fg-2">{formatAuthors(entry.authors)}</p>
          {entry.startedAt ? (
            <p className="mt-2 text-xs text-fg-3">Started {formatShelfDate(entry.startedAt)}</p>
          ) : null}
        </div>
      </Link>
    </li>
  )
}

function ProfileShelfRow({
  title,
  entries,
  labelOf,
}: {
  title: string
  entries: ShelfEntry[]
  labelOf: (entry: ShelfEntry) => ReactNode
}) {
  if (entries.length === 0) {
    return null
  }

  return (
    <div className="py-8">
      <SlideRow title={title} itemCount={entries.length}>
        {entries.map((entry) => (
          <li key={entry.key} className="w-28 shrink-0 snap-start">
            <Link to={bookPath(entry.key)} className="group block no-underline">
              <BookCover
                coverUrl={entry.coverUrl}
                title={entry.title}
                className="aspect-[2/3] w-full rounded-[3px] shadow-cover"
              />
              <p className="mt-2.5 text-xs text-fg-3">{labelOf(entry)}</p>
              <p className="mt-0.5 line-clamp-2 font-title text-sm leading-snug text-fg group-hover:text-brand">
                {entry.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-fg-3">{entry.authors[0]}</p>
            </Link>
          </li>
        ))}
      </SlideRow>
    </div>
  )
}
