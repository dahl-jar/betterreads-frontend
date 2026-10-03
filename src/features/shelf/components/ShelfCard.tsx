import { Link } from 'react-router-dom'

import { BookCover } from '@/components/BookCover'
import { StarRating } from '@/components/StarRating'
import { bookPath } from '@/lib/bookPath'

import { useShelfRating } from '../hooks/useShelfRating'

import { FavoriteMark } from './FavoriteMark'
import { Highlight, HighlightedAuthors } from './Highlight'
import { RatingError } from './RatingError'
import { ShelfControl } from './ShelfControl'
import { type ShelfItemProps } from './shelfItemProps'

export function ShelfCard({ entry, query, onRate, onEntryChange }: ShelfItemProps) {
  const { rating, error, rate } = useShelfRating(entry.myRating ?? 0, onRate)

  return (
    <li className="flex flex-col">
      <Link to={bookPath(entry.key)} className="group block no-underline">
        <BookCover
          coverUrl={entry.coverUrl}
          title={entry.title}
          className="aspect-[2/3] w-full rounded-[3px] shadow-cover"
        />
        <p className="mt-3 line-clamp-2 font-title text-sm font-bold leading-snug text-fg group-hover:text-brand">
          <Highlight text={entry.title} query={query} />
        </p>
        <p className="mt-0.5 truncate text-xs text-fg-3">
          <HighlightedAuthors authors={entry.authors} query={query} />
        </p>
      </Link>
      <div className="mt-2 flex h-5 items-center justify-between">
        <StarRating value={rating} onRate={rate} size="md" />
        {entry.favorite ? (
          <span className="flex items-center">
            <FavoriteMark />
          </span>
        ) : null}
      </div>
      <RatingError error={error} />
      <div className="mt-2">
        <ShelfControl
          bookKey={entry.key}
          entry={entry}
          size="compact"
          onEntryChange={onEntryChange}
        />
      </div>
    </li>
  )
}
