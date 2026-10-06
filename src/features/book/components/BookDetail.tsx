import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { BookCover } from '@/components/BookCover'
import { Skeleton } from '@/components/ui/skeleton'
import { AUTHOR_SEPARATOR, AUTHOR_UNKNOWN } from '@/lib/formatAuthors'

import { type BookDetail as BookDetailData, type Contributor } from '../api/getBook'
import { bookRating } from '../utils/bookRating'

import { RatingPair, type Rating } from './RatingPair'
import { SeriesLinks } from './SeriesLinks'
import { ShowMoreText } from './ShowMoreText'

type BookDetailProps = {
  book: BookDetailData
  seriesHref: (name: string) => string
  authorHref: (authorId: number) => string
  hardcoverRating?: Rating | undefined
  communityRating?: Rating | undefined
  shelfControl?: ReactNode
  facts?: ReactNode
  ratingBars?: ReactNode
}

const GRID_CLASS =
  'grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-x-8 lg:grid-cols-[13rem_minmax(0,1fr)_17rem] lg:gap-10'
const RAIL_ITEM_CLASS = 'col-span-2 empty:hidden lg:order-none'

const CREDIT_LABELS: Record<string, string> = {
  ILLUSTRATOR: 'Illustrated by',
  TRANSLATOR: 'Translated by',
  NARRATOR: 'Narrated by',
  INTRODUCTION: 'Introduction by',
}

type CreditProps = {
  book: BookDetailData
  authorHref: (authorId: number) => string
}

type ContributorLinksProps = {
  contributors: Contributor[]
  authorHref: (authorId: number) => string
}

const PRIMARY_ROLES = new Set(['AUTHOR', 'EDITOR'])

function primaryContributors(contributors: Contributor[]): Contributor[] {
  return contributors.filter((credit) => PRIMARY_ROLES.has(credit.role))
}

function ContributorLinks({ contributors, authorHref }: ContributorLinksProps) {
  return contributors.map((credit, index) => (
    <Fragment key={credit.authorId}>
      {index > 0 ? AUTHOR_SEPARATOR : null}
      <Link to={authorHref(credit.authorId)} className="hover-mark">
        {credit.name}
      </Link>
    </Fragment>
  ))
}

function AuthorLinks({ book, authorHref }: CreditProps) {
  const primary = primaryContributors(book.contributors)
  if (primary.length === 0 && book.authors.length === 0) {
    return <span className="text-fg">{AUTHOR_UNKNOWN}</span>
  }

  return (
    <>
      by{' '}
      <span className="text-fg">
        {primary.length > 0 ? (
          <ContributorLinks contributors={primary} authorHref={authorHref} />
        ) : (
          book.authors.join(AUTHOR_SEPARATOR)
        )}
      </span>
    </>
  )
}

function CreditLine({ book, authorHref }: CreditProps) {
  const credited = book.contributors.filter((credit) => CREDIT_LABELS[credit.role] !== undefined)
  const roles = [...new Set(credited.map((credit) => credit.role))]
  if (roles.length === 0) {
    return null
  }

  return (
    <p className="mt-1 text-sm text-fg-3">
      {roles.map((role, index) => (
        <Fragment key={role}>
          {index > 0 ? ' · ' : null}
          {CREDIT_LABELS[role]}{' '}
          <ContributorLinks
            contributors={credited.filter((credit) => credit.role === role)}
            authorHref={authorHref}
          />
        </Fragment>
      ))}
    </p>
  )
}

export function BookDetail({
  book,
  seriesHref,
  authorHref,
  hardcoverRating,
  communityRating,
  shelfControl,
  facts,
  ratingBars,
}: BookDetailProps) {
  return (
    <article className={GRID_CLASS}>
      <div className="order-1 lg:order-none lg:self-start">
        <BookCover
          coverUrl={book.coverUrl}
          title={book.title}
          className="aspect-[2/3] w-full rounded-[3px] shadow-cover"
        />
      </div>

      <div className="contents lg:block lg:min-w-0">
        <div className="order-2 min-w-0 lg:order-none">
          <SeriesLinks
            book={book}
            seriesHref={seriesHref}
            className="flex flex-wrap gap-x-4 text-xs font-semibold uppercase tracking-[0.1em] text-brand"
          />
          <h1 className="mt-1.5 text-balance font-title text-2xl leading-[1.15] tracking-tight text-fg sm:text-4xl lg:mt-3 lg:text-5xl">
            {book.title}
          </h1>
          {book.subtitle ? (
            <p className="mt-1.5 font-title text-base italic text-fg-2 sm:text-xl">
              {book.subtitle}
            </p>
          ) : null}
          <p className="mt-1.5 text-fg-2 sm:text-lg lg:mt-3">
            <AuthorLinks book={book} authorHref={authorHref} />
            {book.firstPublishYear ? (
              <span className="text-fg-3"> · {book.firstPublishYear}</span>
            ) : null}
          </p>
          <CreditLine book={book} authorHref={authorHref} />
          <div className="mt-3 lg:mt-6">
            <RatingPair
              hardcover={hardcoverRating ?? bookRating(book)}
              community={communityRating}
            />
          </div>
        </div>

        <div className="order-4 col-span-2 flex flex-col gap-6 empty:hidden lg:order-none lg:mt-7">
          {book.description ? (
            <ShowMoreText
              text={book.description}
              className="max-w-[65ch] whitespace-pre-line text-[1.0625rem] leading-[1.7] text-fg-2"
            />
          ) : null}
          {!book.complete ? (
            <p
              role="status"
              className="max-w-[65ch] rounded-md border border-rule bg-sunken px-4 py-3 text-sm text-fg-2"
            >
              We&apos;re still gathering the full details for this book. More sections fill in as
              they arrive.
            </p>
          ) : null}
        </div>
      </div>

      <aside className="contents lg:flex lg:flex-col lg:gap-5">
        {shelfControl ? (
          <div className="order-3 col-span-2 rounded-md border border-rule bg-raised p-3 lg:order-none lg:p-4">
            {shelfControl}
          </div>
        ) : null}
        <div className={`order-5 ${RAIL_ITEM_CLASS}`}>{facts}</div>
        <div className={`order-6 ${RAIL_ITEM_CLASS}`}>{ratingBars}</div>
      </aside>
    </article>
  )
}

export function BookDetailSkeleton() {
  return (
    <div className={GRID_CLASS} role="status" aria-label="Loading book" aria-busy="true">
      <Skeleton className="aspect-[2/3] w-full rounded-[3px] bg-sunken" />
      <div className="min-w-0 space-y-3">
        <Skeleton className="h-8 w-2/3 bg-sunken lg:h-12" />
        <Skeleton className="h-4 w-1/3 bg-sunken" />
        <Skeleton className="mt-6 hidden h-32 w-full bg-sunken lg:block" />
      </div>
      <Skeleton className="col-span-2 h-12 bg-sunken lg:col-span-1 lg:h-64" />
      <Skeleton className="col-span-2 h-32 bg-sunken lg:hidden" />
    </div>
  )
}
