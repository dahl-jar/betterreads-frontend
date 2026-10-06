import { Link } from 'react-router-dom'

import { Avatar } from '@/components/Avatar'
import { SlideRow } from '@/components/SlideRow'
import { authorPath } from '@/lib/authorPath'
import { bookNoun } from '@/lib/bookNoun'
import { formatCount } from '@/lib/formatCount'

import { useAuthorSearch } from '../hooks/useAuthorSearch'

type AuthorResultsProps = {
  query: string
}

export function AuthorResults({ query }: AuthorResultsProps) {
  const { status, hits } = useAuthorSearch(query)

  if (status !== 'success' || hits.length === 0) {
    return null
  }

  return (
    <div className="mt-8">
      <SlideRow title="Authors" itemCount={hits.length}>
        {hits.map((author) => (
          <li key={author.authorId} className="w-36 shrink-0 snap-start">
            <Link
              to={authorPath(author.authorId)}
              className="group flex flex-col items-center gap-2 text-center no-underline"
            >
              <Avatar name={author.name} url={author.photoUrl} size="xl" />
              <span className="line-clamp-2 font-title text-sm leading-snug text-fg group-hover:text-brand">
                {author.name}
              </span>
              <span className="text-xs text-fg-3">
                {formatCount(author.bookCount)} {bookNoun(author.bookCount)}
              </span>
            </Link>
          </li>
        ))}
      </SlideRow>
    </div>
  )
}
