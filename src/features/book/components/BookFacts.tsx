import { Fragment } from 'react'

import { GenreBadge } from '@/components/GenreBadge'
import { joinAuthors } from '@/lib/formatAuthors'
import { formatCount } from '@/lib/formatCount'
import { seriesEntries } from '@/lib/series'
import { uniqueSubjects } from '@/lib/subjects'

import { type BookDetail } from '../api/getBook'

import { SeriesLinks } from './SeriesLinks'

export type Stamp = {
  label: string
  date: string | undefined
  tone: 'read' | 'dropped' | 'brand'
  pressed?: boolean
}

type BookFactsProps = {
  book: BookDetail
  seriesHref: (name: string) => string
  stamp?: Stamp | undefined
}

const LANGUAGE_NAMES = new Intl.DisplayNames(undefined, { type: 'language' })
const SHOWN_GENRES = 8
const TERM_CLASS = 'text-fg-2'
const APPLE_BOOKS_PREFIX = 'https://books.apple.com/'
const APPLE_BOOKS_ICON = '/apple-books.png'
const APPLE_BOOKS_ICON_SIZE = 16

const STAMP_TONE_CLASS = {
  read: 'text-read',
  dropped: 'text-dropped',
  brand: 'text-brand',
} as const

function languageName(code: string): string {
  try {
    return LANGUAGE_NAMES.of(code) ?? code
  } catch {
    return code
  }
}

function factsOf(book: BookDetail) {
  return [
    { term: 'Pages', value: book.pageCount ? formatCount(book.pageCount) : undefined },
    { term: 'Published', value: book.firstPublishYear },
    { term: 'ISBN', value: book.isbn },
    { term: 'Language', value: book.language ? languageName(book.language) : undefined },
    {
      term: 'Ebook',
      value: book.appleBooksUrl?.startsWith(APPLE_BOOKS_PREFIX) ? (
        <AppleBooksLink href={book.appleBooksUrl} />
      ) : undefined,
    },
  ].filter((fact) => fact.value)
}

function AppleBooksLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-brand underline underline-offset-[3px]"
    >
      <img
        src={APPLE_BOOKS_ICON}
        alt=""
        width={APPLE_BOOKS_ICON_SIZE}
        height={APPLE_BOOKS_ICON_SIZE}
        className="size-4 flex-none"
      />
      Apple Books
    </a>
  )
}

function StatusStamp({ stamp }: { stamp: Stamp }) {
  return (
    <p className="mt-5 text-right">
      <span
        key={stamp.label}
        data-fresh={stamp.pressed ? 'true' : undefined}
        className={`stamp text-xs ${STAMP_TONE_CLASS[stamp.tone]}`}
      >
        <span className="block">{stamp.label}</span>
        {stamp.date ? <span className="block">{stamp.date}</span> : null}
      </span>
    </p>
  )
}

export function BookFacts({ book, seriesHref, stamp }: BookFactsProps) {
  const genres = uniqueSubjects(book.subjects).slice(0, SHOWN_GENRES)

  return (
    <div className="catalogue-card font-title text-sm leading-snug text-fg">
      <p className="font-bold uppercase tracking-[0.04em]">{book.title}</p>
      <p>{joinAuthors(book.authors)}</p>
      <dl className="mt-3 grid grid-cols-[5.75rem_minmax(0,1fr)] gap-y-1 border-t border-rule pt-3">
        {factsOf(book).map((fact) => (
          <Fragment key={fact.term}>
            <dt className={TERM_CLASS}>{fact.term}</dt>
            <dd className="break-words">{fact.value}</dd>
          </Fragment>
        ))}
        {seriesEntries(book).length > 0 ? (
          <>
            <dt className={TERM_CLASS}>Series</dt>
            <dd>
              <SeriesLinks
                book={book}
                seriesHref={seriesHref}
                className="flex flex-col items-start"
              />
            </dd>
          </>
        ) : null}
        {genres.length > 0 ? (
          <>
            <dt className={`pt-1 ${TERM_CLASS}`}>Genres</dt>
            <dd className="flex flex-wrap gap-1.5 pt-1 font-ui">
              {genres.map((genre) => (
                <GenreBadge key={genre} label={genre} />
              ))}
            </dd>
          </>
        ) : null}
      </dl>
      {book.awards.length > 0 ? (
        <ul className="mt-3">
          {book.awards.map((award) => (
            <li key={award}>{award}</li>
          ))}
        </ul>
      ) : null}
      {stamp ? <StatusStamp stamp={stamp} /> : null}
    </div>
  )
}
