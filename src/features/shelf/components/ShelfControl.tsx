import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { ChevronDownIcon, HeartIcon, RemoveIcon, WantIcon } from '@/components/icons'
import { useDismiss } from '@/hooks/useDismiss'

import { changeFavorite } from '../api/changeFavorite'
import { changeShelfStatus } from '../api/changeShelfStatus'
import { removeFromShelf } from '../api/removeFromShelf'
import { type ReadingStatus, readingStatusSchema, type ShelfEntry } from '../api/shelfSchemas'
import { useShelfEntry } from '../hooks/useShelfEntry'
import { READING_STATUS_ICONS } from '../utils/readingStatusIcons'
import { READING_STATUS_LABELS } from '../utils/readingStatusLabels'
import { SHELF_LOAD_FAILED } from '../utils/shelfLoadFailed'

import { RadioMark } from './RadioMark'

type ShelfControlSize = 'regular' | 'compact'

type ShelfControlProps = {
  bookKey: string
  entry?: ShelfEntry
  size?: ShelfControlSize
  onEntryChange?: (entry: ShelfEntry | undefined) => void
}

type SizeClasses = {
  button: string
  icon: string
  chevron: string
  toggle: string
  menu: string
  row: string
  divider: string
}

type StatusStyle = {
  buttonClass: string
  menuClass: string
}

const STATUS_STYLES: Record<ReadingStatus, StatusStyle> = {
  WANT_TO_READ: {
    buttonClass: 'border-fg bg-raised text-fg hover:bg-sunken',
    menuClass: 'border-fg',
  },
  CURRENTLY_READING: {
    buttonClass: 'border-brand bg-brand text-on-accent hover:brightness-110',
    menuClass: 'border-brand',
  },
  FINISHED: {
    buttonClass: 'border-read bg-read text-white hover:brightness-110',
    menuClass: 'border-read',
  },
  DROPPED: {
    buttonClass: 'border-dropped bg-dropped text-white hover:brightness-110',
    menuClass: 'border-dropped',
  },
}

const STATUS_OPTIONS = readingStatusSchema.options.map((value) => ({
  value,
  ...READING_STATUS_ICONS[value],
  ...STATUS_STYLES[value],
}))

const DEFAULT_STATUS: ReadingStatus = 'WANT_TO_READ'
const UNSHELVED_BUTTON_CLASS = 'border-accent bg-accent text-on-accent hover:bg-accent-hover'
const UNSHELVED_MENU_CLASS = 'border-accent'
const SIZE_CLASSES: Record<ShelfControlSize, SizeClasses> = {
  regular: {
    button: 'gap-2 py-2.5 pl-4 pr-3 text-sm',
    icon: 'size-[1.125rem] shrink-0',
    chevron: 'size-4',
    toggle: 'px-3',
    menu: 'p-1.5',
    row: 'gap-2.5 px-2.5 py-2 text-sm',
    divider: 'mt-1.5 pt-1.5',
  },
  compact: {
    button: 'gap-1.5 py-1.5 pl-2.5 pr-2 text-[0.8125rem]',
    icon: 'size-4 shrink-0',
    chevron: 'size-3.5',
    toggle: 'px-2',
    menu: 'p-1',
    row: 'gap-2 px-2 py-1.5 text-[0.8125rem]',
    divider: 'mt-1 pt-1',
  },
}

export function ShelfControl({
  bookKey,
  entry: seed,
  size = 'regular',
  onEntryChange,
}: ShelfControlProps) {
  const { authStatus, entry, ready, failed, busy, update } = useShelfEntry(
    bookKey,
    seed,
    onEntryChange,
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useDismiss(menuRef, menuOpen, closeMenu, menuButtonRef)

  if (authStatus !== 'authenticated') {
    return (
      <Link
        to="/login"
        className="block w-full rounded-md bg-accent px-5 py-2.5 text-center text-sm font-semibold text-on-accent hover:bg-accent-hover"
      >
        Log in to track this book
      </Link>
    )
  }

  async function updateShelf(operation: () => Promise<ShelfEntry | undefined>) {
    setMenuOpen(false)
    await update(operation)
  }

  async function chooseStatus(value: ReadingStatus) {
    await updateShelf(() => changeShelfStatus(bookKey, value))
  }

  const applied = STATUS_OPTIONS.find((option) => option.value === entry?.status)
  const favorite = entry?.favorite ?? false
  const buttonClass = applied?.buttonClass ?? UNSHELVED_BUTTON_CLASS
  const menuClass = applied?.menuClass ?? UNSHELVED_MENU_CLASS
  const sized = SIZE_CLASSES[size]
  const triggerClass = `flex flex-1 items-center text-left font-semibold -outline-offset-2 ${sized.button}`
  const rowClass = `flex w-full items-center rounded-md text-left text-fg hover:bg-sunken ${sized.row}`

  return (
    <div className="flex flex-col gap-2">
      <div ref={menuRef} className="relative w-full">
        <div
          className={`flex overflow-hidden border ${menuOpen ? 'rounded-t-md' : 'rounded-md'} ${buttonClass} ${busy ? 'pointer-events-none opacity-50' : ''}`}
        >
          {applied ? (
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              disabled={busy}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className={triggerClass}
            >
              <applied.Icon className={sized.icon} />
              <span className="flex-1">{READING_STATUS_LABELS[applied.value]}</span>
              <ChevronDownIcon className={sized.chevron} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void chooseStatus(DEFAULT_STATUS)}
                disabled={busy}
                className={triggerClass}
              >
                <WantIcon className={sized.icon} />
                {READING_STATUS_LABELS[DEFAULT_STATUS]}
              </button>
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                disabled={busy}
                aria-label="Choose shelf"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className={`border-l border-on-accent/25 -outline-offset-2 ${sized.toggle}`}
              >
                <ChevronDownIcon className={sized.chevron} />
              </button>
            </>
          )}
        </div>

        {menuOpen ? (
          <div
            role="menu"
            aria-label="Reading status"
            className={`absolute inset-x-0 top-full z-20 rounded-b-md border border-t-0 bg-raised shadow-lg ${sized.menu} ${menuClass}`}
          >
            {STATUS_OPTIONS.map((option) => {
              const selected = option === applied
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => void chooseStatus(option.value)}
                  className={`${rowClass} ${selected ? 'bg-sunken font-semibold' : ''}`}
                >
                  <option.Icon className={`${sized.icon} ${option.tone}`} />
                  <span className="flex-1">{READING_STATUS_LABELS[option.value]}</span>
                  <RadioMark selected={selected} tone={option.tone} />
                </button>
              )
            })}
            {applied ? (
              <div className={`border-t border-rule ${sized.divider}`}>
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={favorite}
                  onClick={() => void updateShelf(() => changeFavorite(bookKey, !favorite))}
                  className={`${rowClass} ${favorite ? 'font-semibold' : ''}`}
                >
                  <HeartIcon
                    className={`${sized.icon} ${favorite ? 'text-danger' : 'text-fg-2'}`}
                    filled={favorite}
                  />
                  {favorite ? 'Favorite' : 'Add to favorites'}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    void updateShelf(async () => {
                      await removeFromShelf(bookKey)
                      return undefined
                    })
                  }
                  className={rowClass}
                >
                  <RemoveIcon className={`${sized.icon} text-fg-2`} />
                  Remove from shelf
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          {ready ? 'Could not save your shelf. Try again.' : SHELF_LOAD_FAILED}
        </p>
      ) : null}
    </div>
  )
}
