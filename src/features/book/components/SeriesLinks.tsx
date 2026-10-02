import { Link } from 'react-router-dom'

import { seriesEntries } from '@/lib/series'

import { type BookDetail } from '../api/getBook'

type SeriesLinksProps = {
  book: BookDetail
  seriesHref: (name: string) => string
  className: string
}

export function SeriesLinks({ book, seriesHref, className }: SeriesLinksProps) {
  const series = seriesEntries(book)
  if (series.length === 0) {
    return null
  }
  return (
    <p className={className}>
      {series.map((entry) => (
        <Link key={entry.name} to={seriesHref(entry.name)} className="hover-mark">
          {entry.position ? `${entry.name} #${entry.position}` : entry.name}
        </Link>
      ))}
    </p>
  )
}
