import { Skeleton } from '@/components/ui/skeleton'

import { useBookCount } from '../hooks/useBookCount'

import { FlipNumber } from './FlipNumber'

export function CatalogHeadline() {
  const { status, total } = useBookCount()

  return (
    <>
      <h1 className="font-title text-3xl leading-[1.2] tracking-tight text-fg md:text-[2.75rem]">
        {status === 'error' ? (
          'Search the catalog'
        ) : (
          <>
            <span className="block lg:inline">Search across</span>{' '}
            <span className="whitespace-nowrap">
              {status === 'loading' ? (
                <Skeleton className="inline-block h-[0.75em] w-[3.5em] align-baseline" />
              ) : (
                <FlipNumber value={total} />
              )}{' '}
              books
            </span>
          </>
        )}
      </h1>
      <p className="mt-3 max-w-xl text-fg-2 md:mt-5 md:text-lg">
        Find a title, series, or author. Books we don&apos;t have yet are added while you search.
      </p>
    </>
  )
}
