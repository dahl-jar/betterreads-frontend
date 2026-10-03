import { Link } from 'react-router-dom'

import { BookCover } from '@/components/BookCover'
import { StarRating } from '@/components/StarRating'
import { bookPath } from '@/lib/bookPath'
import { formatAuthors } from '@/lib/formatAuthors'

import { type ShelfEntry } from '../api/shelfSchemas'
import { useShelfRating } from '../hooks/useShelfRating'

import { FavoriteMark } from './FavoriteMark'
import { ShelfControl } from './ShelfControl'

type ShelfCardProps = {
  entry: ShelfEntry
  onRate: (rating: number) => Promise<void>
  onEntryChange: (entry: ShelfEntry | undefined) => void
}

export function ShelfCard({ entry, onRate, onEntryChange }: ShelfCardProps) {
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
          {entry.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-fg-3">{formatAuthors(entry.authors)}</p>
      </Link>
      <div className="mt-2 flex h-5 items-center justify-between">
        <StarRating value={rating} onRate={rate} size="md" />
        {entry.favorite ? (
          <span className="flex items-center">
            <FavoriteMark />
          </span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
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
