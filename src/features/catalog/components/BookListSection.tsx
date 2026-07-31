import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { TabList } from '@/components/TabList'
import { Skeleton } from '@/components/ui/skeleton'

import { type BookCard, type BookListType } from '../api/getBookList'
import { useBookList } from '../hooks/useBookList'

const TABS: { id: BookListType; label: string }[] = [
  { id: 'TOP_RATED', label: 'Top rated' },
  { id: 'RECENTLY_ADDED', label: 'Recently added' },
]

const FADE = '0.75rem'
const SOLID = 'black'
const CLEAR = 'transparent'

const PAGE_FRACTION = 0.8

const COVER_HEIGHT = 'h-48'
const COVER_SIZE = `${COVER_HEIGHT} w-32`

function edgeMask(fadeLeft: boolean, fadeRight: boolean): string | undefined {
  if (!fadeLeft && !fadeRight) {
    return undefined
  }
  const start = fadeLeft ? `${CLEAR}, ${SOLID} ${FADE}` : SOLID
  const end = fadeRight ? `${SOLID} calc(100% - ${FADE}), ${CLEAR}` : SOLID
  return `linear-gradient(to right, ${start}, ${end})`
}

function useStripScroll(itemCount: number) {
  const ref = useRef<HTMLUListElement>(null)
  const [fadeLeft, setFadeLeft] = useState(false)
  const [fadeRight, setFadeRight] = useState(false)

  const measure = useCallback(() => {
    const strip = ref.current
    if (!strip) {
      return
    }
    setFadeLeft(strip.scrollLeft > 0)
    setFadeRight(strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1)
  }, [])

  const scrollByPage = useCallback((direction: 1 | -1) => {
    const strip = ref.current
    if (!strip) {
      return
    }
    strip.scrollBy({ left: direction * strip.clientWidth * PAGE_FRACTION, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure, itemCount])

  return { ref, fadeLeft, fadeRight, measure, scrollByPage }
}

function CardCover({ card }: { card: BookCard }) {
  if (!card.coverUrl) {
    return (
      <div
        aria-hidden="true"
        className={`flex ${COVER_SIZE} shrink-0 items-center justify-center rounded-md border border-line bg-muted/40 text-2xl font-semibold text-ink-faint`}
      >
        {card.title.charAt(0).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={card.coverUrl}
      alt=""
      loading="lazy"
      className={`${COVER_SIZE} shrink-0 rounded-md border border-line object-cover shadow-card`}
    />
  )
}

function CardRating({ card }: { card: BookCard }) {
  if (card.averageRating === null || card.averageRating === undefined) {
    return null
  }
  return (
    <p className="mt-1 text-sm text-ink-soft">
      <span className="text-rust">★</span> {card.averageRating.toFixed(1)}
      {card.ratingCount ? (
        <>
          <span aria-hidden="true"> · </span>
          <span>
            {card.ratingCount.toLocaleString()} {card.ratingCount === 1 ? 'rating' : 'ratings'}
          </span>
        </>
      ) : null}
    </p>
  )
}

type CarouselArrowProps = {
  direction: 'previous' | 'next'
  disabled: boolean
  onClick: () => void
}

function CarouselArrow({ direction, disabled, onClick }: CarouselArrowProps) {
  return (
    <div className={`hidden shrink-0 items-center self-start ${COVER_HEIGHT} md:flex`}>
      <button
        type="button"
        aria-label={direction === 'previous' ? 'Previous books' : 'Next books'}
        disabled={disabled}
        onClick={onClick}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface text-ink-soft transition hover:border-green/50 hover:text-green disabled:invisible"
      >
        {direction === 'previous' ? '‹' : '›'}
      </button>
    </div>
  )
}

export function BookListSection() {
  const [tab, setTab] = useState<BookListType>('TOP_RATED')
  const { status, cards } = useBookList(tab)
  const { ref, fadeLeft, fadeRight, measure, scrollByPage } = useStripScroll(cards.length)

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-12">
      <TabList
        tabs={TABS}
        activeTab={tab}
        ariaLabel="Book lists"
        accent="rust"
        uppercase
        onTabChange={setTab}
      />

      {status === 'error' ? (
        <p role="alert" className="mt-6 text-sm text-ink-soft">
          Could not load this list. Try again in a moment.
        </p>
      ) : null}

      {status === 'loading' ? (
        <ul className="mt-6 flex gap-5 overflow-x-auto" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={index} className="shrink-0">
              <Skeleton className={COVER_SIZE} />
            </li>
          ))}
        </ul>
      ) : null}

      {status === 'success' && cards.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">No books here yet.</p>
      ) : null}

      {status === 'success' && cards.length > 0 ? (
        <div className="mt-6 flex items-stretch gap-3">
          <CarouselArrow
            direction="previous"
            disabled={!fadeLeft}
            onClick={() => scrollByPage(-1)}
          />
          <ul
            ref={ref}
            onScroll={measure}
            data-testid="carousel-strip"
            style={{
              maskImage: edgeMask(fadeLeft, fadeRight),
              WebkitMaskImage: edgeMask(fadeLeft, fadeRight),
            }}
            className="flex flex-1 gap-5 overflow-x-auto scroll-smooth scrollbar-none"
          >
            {cards.map((card) => (
              <li key={card.key} className="w-32 shrink-0">
                <Link to={`/books/${card.key}`} className="group block">
                  <CardCover card={card} />
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-ink group-hover:text-green">
                    {card.title}
                  </p>
                  {card.authors.length > 0 ? (
                    <p className="text-xs text-ink-soft">{card.authors[0]}</p>
                  ) : null}
                  <CardRating card={card} />
                </Link>
              </li>
            ))}
          </ul>
          <CarouselArrow direction="next" disabled={!fadeRight} onClick={() => scrollByPage(1)} />
        </div>
      ) : null}
    </section>
  )
}
