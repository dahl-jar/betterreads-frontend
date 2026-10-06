import { Link } from 'react-router-dom'

import { Avatar } from '@/components/Avatar'
import { BookCover } from '@/components/BookCover'
import { SlideRow } from '@/components/SlideRow'
import { bookNoun } from '@/lib/bookNoun'
import { bookPath } from '@/lib/bookPath'

import { type AuthorBook, type AuthorPage } from '../api/getAuthor'

const ROLE_LABELS: Record<string, string> = {
  EDITOR: 'Editor',
  ILLUSTRATOR: 'Illustrator',
  TRANSLATOR: 'Translator',
  NARRATOR: 'Narrator',
  INTRODUCTION: 'Introduction',
  OTHER: 'Contributor',
}

const STANDALONE_TITLE = 'Other books'

const WEB_LINK = /^https?:\/\//

type BookGroup = {
  title: string
  books: AuthorBook[]
}

function groupTitle(book: AuthorBook): string {
  return book.seriesName ?? STANDALONE_TITLE
}

function groupBooks(books: AuthorBook[]): BookGroup[] {
  const titles = [...new Set(books.map(groupTitle))]
  const groups = titles.map((title) => ({
    title,
    books: books.filter((book) => groupTitle(book) === title),
  }))
  return [
    ...groups.filter((group) => group.title !== STANDALONE_TITLE),
    ...groups.filter((group) => group.title === STANDALONE_TITLE),
  ]
}

function AuthorBookCard({ book }: { book: AuthorBook }) {
  const role = ROLE_LABELS[book.role]
  return (
    <li className="w-28 shrink-0 snap-start">
      <Link to={bookPath(book.bookId)} className="group block no-underline">
        <BookCover
          coverUrl={book.coverUrl}
          title={book.title}
          className="aspect-[2/3] w-full rounded-[3px] shadow-cover"
        />
        {book.seriesPosition ? (
          <p className="mt-2.5 text-xs text-fg-3">Book {book.seriesPosition}</p>
        ) : null}
        <p className="mt-0.5 line-clamp-2 font-title text-sm leading-snug text-fg group-hover:text-brand">
          {book.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-fg-3">
          {[book.firstPublishYear, role]
            .filter((part) => part !== undefined && part !== null)
            .join(' · ')}
        </p>
      </Link>
    </li>
  )
}

function Bio({ bio }: { bio: string }) {
  if (WEB_LINK.test(bio)) {
    return (
      <a href={bio} target="_blank" rel="noopener noreferrer" className="hover-mark text-brand">
        Biography
      </a>
    )
  }
  return <p className="max-w-[65ch] whitespace-pre-line leading-[1.7] text-fg-2">{bio}</p>
}

export function AuthorDetail({ author }: { author: AuthorPage }) {
  const groups = groupBooks(author.books)

  return (
    <article>
      <header className="flex items-center gap-5">
        <Avatar name={author.name} url={author.photoUrl} size="xl" />
        <div className="min-w-0">
          <h1 className="font-title text-3xl tracking-tight text-fg md:text-4xl">{author.name}</h1>
          <p className="mt-1 text-fg-3">
            {author.books.length} {bookNoun(author.books.length)}
          </p>
        </div>
      </header>
      {author.bio ? (
        <div className="mt-6">
          <Bio bio={author.bio} />
        </div>
      ) : null}
      <div className="mt-10 flex flex-col divide-y divide-rule">
        {groups.map((group) => (
          <div key={group.title} className="py-8 first:pt-0 last:pb-0">
            <SlideRow title={group.title} itemCount={group.books.length}>
              {group.books.map((book) => (
                <AuthorBookCard key={book.bookId} book={book} />
              ))}
            </SlideRow>
          </div>
        ))}
      </div>
    </article>
  )
}
