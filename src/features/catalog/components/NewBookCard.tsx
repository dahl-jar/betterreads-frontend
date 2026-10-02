import { Link } from 'react-router-dom'

import { BookCover } from '@/components/BookCover'

import { type BookCard } from '../api/getBookList'

type NewBookCardProps = {
  card: BookCard
}

export function NewBookCard({ card }: NewBookCardProps) {
  const author = card.authors[0]

  return (
    <Link
      to={`/books/${card.key}`}
      className="catalogue-card hidden -rotate-2 text-fg no-underline md:block"
    >
      <p className="border-b border-rule pb-2 font-title text-xs font-bold uppercase tracking-[0.12em] text-brand">
        New in the catalog
      </p>
      <div className="mt-4 flex gap-4">
        <BookCover
          coverUrl={card.coverUrl}
          title={card.title}
          className="h-28 w-[4.75rem] shrink-0 rounded-[2px] shadow-md"
        />
        <div className="min-w-0">
          <p className="line-clamp-3 font-title text-lg font-semibold leading-snug">{card.title}</p>
          {author ? <p className="mt-1 font-title text-sm">{author}</p> : null}
          {card.firstPublishYear ? (
            <p className="mt-2 font-title text-xs text-fg-2">Published {card.firstPublishYear}</p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
