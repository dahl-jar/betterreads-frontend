import { type ComponentType, useState } from 'react'

import { GridIcon, ListIcon } from '@/components/icons'
import { Pagination } from '@/components/Pagination'
import { bookNoun } from '@/lib/bookNoun'

import { useShelfEntries } from '../hooks/useShelfEntries'
import { matchesFilter, type ShelfFilter } from '../utils/shelfFilters'
import { SHELF_LIST_COLUMNS } from '../utils/shelfListColumns'
import { SHELF_LOAD_FAILED } from '../utils/shelfLoadFailed'
import { matchesQuery } from '../utils/shelfSearch'
import { SHELF_SORTS, type ShelfSort } from '../utils/shelfSorts'

import { ShelfCard } from './ShelfCard'
import { type ShelfItemProps } from './shelfItemProps'
import { ShelfRail } from './ShelfRail'
import { ShelfRow } from './ShelfRow'
import { ShelfSearch } from './ShelfSearch'
import { SortMenu } from './SortMenu'
import { ViewToggle } from './ViewToggle'

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

const LAYOUTS: Record<ShelfView, { Item: ComponentType<ShelfItemProps>; listClass: string }> = {
  list: { Item: ShelfRow, listClass: 'divide-y divide-rule' },
  cover: {
    Item: ShelfCard,
    listClass: 'grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4',
  },
}

const INLINE_ACTION = 'font-semibold text-brand underline underline-offset-2'

type NoMatchesProps = {
  query: string
  filter: ShelfFilter
  onClear: () => void
  onShowAll: () => void
}

function NoMatches({ query, filter, onClear, onShowAll }: NoMatchesProps) {
  return (
    <div className="py-10">
      <p className="text-fg">
        No books match <span className="font-semibold">“{query.trim()}”</span>.
      </p>
      <p className="mt-1 text-sm text-fg-2">
        {filter === 'ALL' ? 'Check the spelling or ' : 'Check the spelling, '}
        <button type="button" onClick={onClear} className={INLINE_ACTION}>
          clear the search
        </button>
        {filter === 'ALL' ? null : (
          <>
            , or look in{' '}
            <button type="button" onClick={onShowAll} className={INLINE_ACTION}>
              All books
            </button>
          </>
        )}
        .
      </p>
    </div>
  )
}

export function ShelfList({ initialFilter = 'ALL', onRate }: ShelfListProps) {
  const { status, entries, changeFor, rateFor } = useShelfEntries(onRate)
  const [filter, setFilter] = useState<ShelfFilter>(initialFilter)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<ShelfSort>('added')
  const [view, setView] = useState<ShelfView>('list')
  const [page, setPage] = useState(1)

  const searching = query.trim() !== ''
  const shown = entries
    .filter((entry) => matchesFilter(entry, filter) && matchesQuery(entry, query))
    .sort(SHELF_SORTS[sort].compare)
  const lastPage = Math.max(1, Math.ceil(shown.length / SHELF_PAGE_SIZE))
  const currentPage = Math.min(page, lastPage)
  const pageStart = (currentPage - 1) * SHELF_PAGE_SIZE
  const pageEntries = shown.slice(pageStart, pageStart + SHELF_PAGE_SIZE)

  const selectFilter = (next: ShelfFilter) => {
    setFilter(next)
    setPage(1)
  }

  const changeQuery = (next: string) => {
    setQuery(next)
    setPage(1)
  }

  const Item = LAYOUTS[view].Item
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
      <div>
        {title}
        <p className="mt-1 text-sm text-fg-2" aria-live="polite">
          {shown.length} {bookNoun(shown.length)}
          {searching ? ' found' : null}
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
        <ShelfRail entries={entries} filter={filter} onFilter={selectFilter} />
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <ShelfSearch query={query} onQueryChange={changeQuery} />
            <div className="ml-auto flex items-center gap-3">
              <SortMenu sort={sort} onSort={setSort} />
              <ViewToggle options={VIEW_OPTIONS} view={view} onView={setView} />
            </div>
          </div>
          {shown.length === 0 && searching ? (
            <NoMatches
              query={query}
              filter={filter}
              onClear={() => changeQuery('')}
              onShowAll={() => selectFilter('ALL')}
            />
          ) : null}
          {shown.length === 0 && !searching ? (
            <p className="py-10 text-fg-2">No books on this shelf yet.</p>
          ) : null}
          {shown.length > 0 && view === 'list' ? (
            <div
              className={`hidden gap-x-5 border-b border-rule pb-3 md:grid ${SHELF_LIST_COLUMNS}`}
            >
              <span className="label-caps col-span-2">Book</span>
              <span className="label-caps">Your rating</span>
              <span className="label-caps">Date</span>
              <span className="label-caps">Shelf</span>
            </div>
          ) : null}
          {shown.length > 0 ? (
            <ul className={LAYOUTS[view].listClass}>
              {pageEntries.map((entry) => (
                <Item
                  key={entry.key}
                  entry={entry}
                  query={query}
                  onRate={rateFor(entry)}
                  onEntryChange={changeFor(entry.key)}
                />
              ))}
            </ul>
          ) : null}
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
