import { Skeleton } from '@/components/ui/skeleton'

import { useBookCount } from '../hooks/useBookCount'

import { FlipNumber } from './FlipNumber'

export function CatalogHeadline() {
  const { status, total } = useBookCount()

  return (
    <>
      <h1 className="font-body text-4xl font-semibold tracking-tight text-ink md:text-5xl">
        {status === 'error' ? (
          'Search the catalog'
        ) : (
          <>
            Search{' '}
            {status === 'loading' ? (
              <Skeleton className="inline-block h-[0.75em] w-[3.5em] align-baseline" />
            ) : (
              <FlipNumber value={total} />
            )}{' '}
            books
          </>
        )}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
        Find a title, series, or author. Books we don&apos;t have yet are added while you search.
      </p>
    </>
  )
}
