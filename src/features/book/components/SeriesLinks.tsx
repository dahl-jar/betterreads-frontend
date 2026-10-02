import { Link } from 'react-router-dom'

import { seriesEntries } from '@/lib/series'

import { type BookDetail } from '../api/getBook'

type SeriesLinksProps = {
  book: BookDetail
}

export function SeriesLinks({ book }: SeriesLinksProps) {
  const series = seriesEntries(book)
  if (series.length === 0) {
    return null
  }
  return (
    <p className="flex flex-wrap gap-x-4 font-display text-lg italic text-ink-soft">
      {series.map((entry) => (
        <Link
          key={entry.name}
          to={`/search?q=${encodeURIComponent(entry.name)}`}
          className="hover:text-green hover:underline"
        >
          {entry.position ? `${entry.name} #${entry.position}` : entry.name}
        </Link>
      ))}
    </p>
  )
}
