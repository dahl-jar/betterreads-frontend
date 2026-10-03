import { useCallback, useId, useRef, useState } from 'react'

import { ChevronDownIcon } from '@/components/icons'
import { useDismiss } from '@/hooks/useDismiss'

import { SHELF_SORTS, type ShelfSort } from '../utils/shelfSorts'

import { RadioMark } from './RadioMark'

type SortMenuProps = {
  sort: ShelfSort
  onSort: (sort: ShelfSort) => void
}

const SORT_KEYS = Object.keys(SHELF_SORTS) as ShelfSort[]

export function SortMenu({ sort, onSort }: SortMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const labelId = useId()
  const valueId = useId()

  const close = useCallback(() => setOpen(false), [])
  useDismiss(menuRef, open, close, buttonRef)

  const choose = (next: ShelfSort) => {
    setOpen(false)
    onSort(next)
  }

  return (
    <div className="flex items-center gap-2 text-sm text-fg-2">
      <span id={labelId}>Sort by</span>
      <div ref={menuRef} className="relative w-44">
        <div
          className={`flex overflow-hidden border border-fg bg-raised text-fg hover:bg-sunken ${open ? 'rounded-t-md' : 'rounded-md'}`}
        >
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-labelledby={`${labelId} ${valueId}`}
            className="flex flex-1 items-center gap-1.5 py-1.5 pl-2.5 pr-2 text-left text-[0.8125rem] font-semibold -outline-offset-2"
          >
            <span id={valueId} className="flex-1">
              {SHELF_SORTS[sort].label}
            </span>
            <ChevronDownIcon className="size-3.5" />
          </button>
        </div>
        {open ? (
          <div
            role="menu"
            aria-label="Sort by"
            className="absolute inset-x-0 top-full z-20 rounded-b-md border border-t-0 border-fg bg-raised p-1 shadow-lg"
          >
            {SORT_KEYS.map((key) => {
              const selected = key === sort
              return (
                <button
                  key={key}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => choose(key)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[0.8125rem] text-fg hover:bg-sunken ${selected ? 'bg-sunken font-semibold' : ''}`}
                >
                  <span className="flex-1">{SHELF_SORTS[key].label}</span>
                  <RadioMark selected={selected} tone="text-fg" />
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
