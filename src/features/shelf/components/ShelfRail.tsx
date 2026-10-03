import { type ComponentType, Fragment } from 'react'

import { BooksIcon, HeartIcon } from '@/components/icons'
import {
  RAIL_CLASS,
  RAIL_ITEM_CLASS,
  RAIL_ITEM_CURRENT_CLASS,
  RAIL_ITEM_OTHER_CLASS,
} from '@/components/railClasses'

import { readingStatusSchema, type ShelfEntry } from '../api/shelfSchemas'
import { READING_STATUS_ICONS } from '../utils/readingStatusIcons'
import { READING_STATUS_LABELS } from '../utils/readingStatusLabels'
import { countFor, type ShelfFilter } from '../utils/shelfFilters'

type ShelfRailProps = {
  entries: ShelfEntry[]
  filter: ShelfFilter
  onFilter: (filter: ShelfFilter) => void
}

type RailItem = {
  filter: ShelfFilter
  label: string
  Icon: ComponentType<{ className?: string }>
  divided: boolean
}

const RAIL_ITEMS: RailItem[] = [
  { filter: 'ALL', label: 'All books', Icon: BooksIcon, divided: false },
  ...readingStatusSchema.options.map((status) => ({
    filter: status,
    label: READING_STATUS_LABELS[status],
    Icon: READING_STATUS_ICONS[status].Icon,
    divided: false,
  })),
  { filter: 'FAVORITES', label: 'Favorites', Icon: HeartIcon, divided: true },
]

export function ShelfRail({ entries, filter, onFilter }: ShelfRailProps) {
  return (
    <nav aria-label="Shelves" className={RAIL_CLASS}>
      {RAIL_ITEMS.map((item) => {
        const active = filter === item.filter
        return (
          <Fragment key={item.filter}>
            {item.divided ? (
              <span
                aria-hidden="true"
                className="hidden lg:my-2 lg:block lg:border-t lg:border-rule"
              />
            ) : null}
            <button
              type="button"
              onClick={() => onFilter(item.filter)}
              aria-pressed={active}
              className={`flex items-center gap-2.5 ${RAIL_ITEM_CLASS} ${active ? RAIL_ITEM_CURRENT_CLASS : RAIL_ITEM_OTHER_CLASS}`}
            >
              <item.Icon className="size-4 shrink-0" />
              <span>{item.label}</span>{' '}
              <span className="text-xs tabular-nums opacity-60 lg:ml-auto">
                {countFor(entries, item.filter)}
              </span>
            </button>
          </Fragment>
        )
      })}
    </nav>
  )
}
