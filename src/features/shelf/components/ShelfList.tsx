import { useState } from 'react'

import { GridIcon, ListIcon } from '@/components/icons'
import { Pagination } from '@/components/Pagination'
import { bookNoun } from '@/lib/bookNoun'

import { useShelfEntries } from '../hooks/useShelfEntries'
import { matchesFilter, type ShelfFilter } from '../utils/shelfFilters'
import { SHELF_LIST_COLUMNS } from '../utils/shelfListColumns'
import { SHELF_LOAD_FAILED } from '../utils/shelfLoadFailed'
import { SHELF_SORTS, type ShelfSort } from '../utils/shelfSorts'

import { ShelfCard } from './ShelfCard'
import { ShelfRail } from './ShelfRail'
import { ShelfRow } from './ShelfRow'
import { SortMenu } from './SortMenu'

type ShelfListProps = {
  initialFilter?: ShelfFilter
  onRate: (key: string, rating: number) => Promise<void>
}

type ShelfView = 'list' | 'cover'

const SHELF_PAGE_SIZE = 15

const VIEW_OPTIONS = [
  { view: 'list', label: 'List view', Icon: ListIcon },
  { view: 'cover', label: 'Cover view', Icon: GridIcon },
] as const

export function ShelfList({ initialFilter = 'ALL', onRate }: ShelfListProps) {
  const { status, entries, changeFor, rateFor } = useShelfEntries(onRate)
  const [filter, setFilter] = useState<ShelfFilter>(initialFilter)
  const [sort, setSort] = useState<ShelfSort>('added')
  const [view, setView] = useState<ShelfView>('list')
  const [page, setPage] = useState(1)

  const shown = entries
    .filter((entry) => matchesFilter(entry, filter))
    .sort(SHELF_SORTS[sort].compare)
  const lastPage = Math.max(1, Math.ceil(shown.length / SHELF_PAGE_SIZE))
  const currentPage = Math.min(page, lastPage)
  const pageStart = (currentPage - 1) * SHELF_PAGE_SIZE
  const pageEntries = shown.slice(pageStart, pageStart + SHELF_PAGE_SIZE)

  const selectFilter = (next: ShelfFilter) => {
    setFilter(next)
    setPage(1)
  }

  const title = <h1 className="font-title text-3xl text-fg">My books</h1>

  if (status === 'error') {
    return (
      <>
        {title}
        <p role="alert" className="mt-6 text-sm text-destructive">
          {SHELF_LOAD_FAILED}
        </p>
      </>
    )
  }

  if (status === 'loading') {
    return title
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {title}
          <p className="mt-1 text-sm text-fg-2">
            {shown.length} {bookNoun(shown.length)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SortMenu sort={sort} onSort={setSort} />
          <div className="flex divide-x divide-rule overflow-hidden rounded-md border border-rule">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.view}
                type="button"
                onClick={() => setView(option.view)}
                aria-pressed={view === option.view}
                aria-label={option.label}
                className={`flex size-9 items-center justify-center ${view === option.view ? 'bg-sunken text-fg' : 'text-fg-3 hover:text-fg'}`}
              >
                <option.Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
        <ShelfRail entries={entries} filter={filter} onFilter={selectFilter} />
        <div className="min-w-0">
          {shown.length === 0 ? (
            <p className="py-10 text-fg-2">No books on this shelf yet.</p>
          ) : view === 'list' ? (
            <>
              <div
                className={`hidden gap-x-5 border-b border-rule pb-3 md:grid ${SHELF_LIST_COLUMNS}`}
              >
                <span className="label-caps col-span-2">Book</span>
                <span className="label-caps">Your rating</span>
                <span className="label-caps">Date</span>
                <span className="label-caps">Shelf</span>
              </div>
              <ul className="divide-y divide-rule">
                {pageEntries.map((entry) => (
                  <ShelfRow
                    key={entry.key}
                    entry={entry}
                    onRate={rateFor(entry)}
                    onEntryChange={changeFor(entry.key)}
                  />
                ))}
              </ul>
            </>
          ) : (
            <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4">
              {pageEntries.map((entry) => (
                <ShelfCard
                  key={entry.key}
                  entry={entry}
                  onRate={rateFor(entry)}
                  onEntryChange={changeFor(entry.key)}
                />
              ))}
            </ul>
          )}
          <Pagination
            page={currentPage}
            hasNext={currentPage < lastPage}
            ariaLabel="Shelf pages"
            onPageChange={setPage}
          />
        </div>
      </div>
    </>
  )
}
