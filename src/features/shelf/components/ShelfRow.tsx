import { Link } from 'react-router-dom'

import { BookCover } from '@/components/BookCover'
import { StarIcon } from '@/components/icons'
import { StarRating } from '@/components/StarRating'
import { bookPath } from '@/lib/bookPath'
import { formatRating } from '@/lib/formatRating'

import { useShelfRating } from '../hooks/useShelfRating'
import { shelfDateLine } from '../utils/shelfDateLine'
import { SHELF_LIST_COLUMNS } from '../utils/shelfListColumns'

import { FavoriteMark } from './FavoriteMark'
import { Highlight, HighlightedAuthors } from './Highlight'
import { RatingError } from './RatingError'
import { ShelfControl } from './ShelfControl'
import { type ShelfItemProps } from './shelfItemProps'

export function ShelfRow({ entry, query, onRate, onEntryChange }: ShelfItemProps) {
  const { rating, error, rate } = useShelfRating(entry.myRating ?? 0, onRate)
  const { verb, date } = shelfDateLine(entry)
  const path = bookPath(entry.key)

  return (
    <li
      className={`grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-x-5 gap-y-4 py-5 ${SHELF_LIST_COLUMNS}`}
    >
      <Link to={path} tabIndex={-1} aria-hidden="true" className="block">
        <BookCover
          coverUrl={entry.coverUrl}
          title={entry.title}
          className="h-[84px] w-14 rounded-[3px] shadow-cover"
        />
      </Link>
      <div className="min-w-0">
        <p className="font-title text-lg font-bold leading-snug">
          <Link to={path} className="text-fg no-underline hover:text-brand">
            <Highlight text={entry.title} query={query} />
          </Link>
          {entry.favorite ? (
            <span className="ml-2 inline-flex align-[-0.1em]">
              <FavoriteMark />
            </span>
          ) : null}
        </p>
        <p className="mt-1 truncate text-sm text-fg-2">
          <HighlightedAuthors authors={entry.authors} query={query} />
        </p>
        {entry.communityCount > 0 && entry.communityAverage ? (
          <p className="mt-2 flex items-center gap-1 text-xs text-fg-3">
            <StarIcon className="size-3 text-star" />
            <span className="font-semibold tabular-nums text-fg-2">
              {formatRating(entry.communityAverage)}
            </span>
            BetterReads
          </p>
        ) : null}
        <RatingError error={error} />
      </div>
      <div className="order-4 col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 md:contents">
        <div className="order-first w-48 md:order-5 md:w-auto">
          <ShelfControl
            bookKey={entry.key}
            entry={entry}
            size="compact"
            onEntryChange={onEntryChange}
          />
        </div>
        <div className="md:order-3">
          <StarRating value={rating} onRate={rate} size="md" />
        </div>
        <p className="text-sm text-fg-2 md:order-4">
          <span className="text-fg-3">{verb}</span> {date}
        </p>
      </div>
    </li>
  )
}
