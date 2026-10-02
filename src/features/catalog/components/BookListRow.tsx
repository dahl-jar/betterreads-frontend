import { Link } from 'react-router-dom'

import { BookCover } from '@/components/BookCover'
import { StarIcon } from '@/components/icons'
import { SlideRow } from '@/components/SlideRow'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRating } from '@/lib/formatRating'

import { type BookCard } from '../api/getBookList'
import { type BookListState } from '../hooks/useBookList'

type BookListRowProps = {
  title: string
  note: string
  state: BookListState
  labelOf: (card: BookCard, index: number) => string
}

const SKELETON_COUNT = 6

const CARD_CLASS = 'w-32 shrink-0 snap-start md:w-36'
const COVER_CLASS = 'aspect-[2/3] w-full rounded-[3px]'
const MESSAGE_CLASS = 'text-sm text-fg-2'

function scoreOf(card: BookCard): string | undefined {
  if (card.averageRating === null || card.averageRating === undefined) {
    return undefined
  }
  return (card.ratingCount ?? 0) > 0 ? formatRating(card.averageRating) : undefined
}

function BookListCard({ card, label }: { card: BookCard; label: string }) {
  const score = scoreOf(card)
  const author = card.authors[0]

  return (
    <li className={CARD_CLASS}>
      <Link to={`/books/${card.key}`} className="group block no-underline">
        <BookCover
          coverUrl={card.coverUrl}
          title={card.title}
          className={`${COVER_CLASS} shadow-cover`}
        />
        <p className="mt-3 flex items-center justify-between gap-2">
          <span className="label-caps">{label}</span>
          {score ? (
            <span className="flex items-center gap-1 text-sm font-semibold text-fg">
              <StarIcon className="size-3.5 shrink-0 text-star" />
              {score}
            </span>
          ) : null}
        </p>
        <p className="mt-1 line-clamp-2 font-title text-[0.9375rem] font-bold leading-snug text-fg group-hover:text-brand">
          {card.title}
        </p>
        {author ? <p className="mt-1 truncate text-sm text-fg-3">{author}</p> : null}
      </Link>
    </li>
  )
}

export function BookListRow({ title, note, state, labelOf }: BookListRowProps) {
  const { status, cards } = state

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6">
      <SlideRow title={title} note={note} itemCount={cards.length}>
        {status === 'loading'
          ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <li key={index} className={CARD_CLASS}>
                <Skeleton className={COVER_CLASS} />
              </li>
            ))
          : null}

        {status === 'error' ? (
          <li>
            <p role="alert" className={MESSAGE_CLASS}>
              Could not load this list. Try again in a moment.
            </p>
          </li>
        ) : null}

        {status === 'success' && cards.length === 0 ? (
          <li>
            <p className={MESSAGE_CLASS}>No books here yet.</p>
          </li>
        ) : null}

        {cards.map((card, index) => (
          <BookListCard key={card.key} card={card} label={labelOf(card, index)} />
        ))}
      </SlideRow>
    </div>
  )
}
