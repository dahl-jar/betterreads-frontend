import { Link } from 'react-router-dom'

import { useDocumentTitle } from '../useDocumentTitle'

type NotFoundKind = 'error' | 'book' | 'page'

type NotFoundPageProps = {
  kind: NotFoundKind
}

const COPY: Record<NotFoundKind, { title: string; description: string }> = {
  error: {
    title: 'Something went wrong',
    description: "This page couldn't load. Try again or return to search.",
  },
  book: {
    title: 'Book not found',
    description: "We couldn't find this book. Check the address or head back to search.",
  },
  page: {
    title: 'Page not found',
    description: "This page doesn't exist or has moved. Return to search to keep browsing.",
  },
}

export function NotFoundPage({ kind }: NotFoundPageProps) {
  const copy = COPY[kind]
  useDocumentTitle(copy.title)

  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-5 px-6 py-20 text-center">
      <p
        aria-hidden="true"
        className="font-display text-[7rem] font-bold leading-none text-green sm:text-[9rem]"
      >
        {kind === 'error' ? 'Oops' : '404'}
      </p>
      <h1 className="font-display text-2xl font-semibold text-ink">{copy.title}</h1>
      <p className="max-w-md text-ink-soft">{copy.description}</p>
      <Link
        to="/"
        className="rounded-md bg-green px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-green-deep"
      >
        Back to search
      </Link>
    </main>
  )
}
