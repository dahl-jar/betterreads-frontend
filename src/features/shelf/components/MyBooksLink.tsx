import { Link } from 'react-router-dom'

import { BooksIcon } from '@/components/icons'
import { bookNoun } from '@/lib/bookNoun'
import { formatCount } from '@/lib/formatCount'
import { SHELF_PATH } from '@/lib/shelfPath'

type MyBooksLinkProps = {
  count: number | undefined
  current: boolean
}

export function MyBooksLink({ count, current }: MyBooksLinkProps) {
  return (
    <Link
      to={SHELF_PATH}
      aria-current={current ? 'page' : undefined}
      className={`hidden h-10 items-center gap-2 rounded-full px-3.5 text-[0.9375rem] no-underline sm:flex ${current ? 'bg-brand-soft text-brand' : 'text-fg hover:bg-sunken'}`}
    >
      <BooksIcon className="size-[1.125rem] shrink-0" />
      My books
      {count === undefined ? null : (
        <>
          <span className="sr-only">
            , {formatCount(count)} {bookNoun(count)}
          </span>
          <span
            aria-hidden="true"
            className={`rounded-full ${current ? 'bg-brand text-on-accent' : 'bg-sunken text-fg-2'} px-2 py-0.5 text-xs font-bold tabular-nums`}
          >
            {formatCount(count)}
          </span>
        </>
      )}
    </Link>
  )
}
