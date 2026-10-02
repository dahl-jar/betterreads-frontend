import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  ChevronDownIcon,
  DroppedIcon,
  HeartIcon,
  ReadIcon,
  ReadingIcon,
  RemoveIcon,
  WantIcon,
} from '@/components/icons'
import { useAuth } from '@/hooks/useAuth'
import { type DismissReason, useDismiss } from '@/hooks/useDismiss'

import { changeFavorite } from '../api/changeFavorite'
import { changeShelfStatus } from '../api/changeShelfStatus'
import { getShelfEntry } from '../api/getShelfEntry'
import { removeFromShelf as removeFromShelfRequest } from '../api/removeFromShelf'
import { type ReadingStatus, type ShelfEntry } from '../api/shelfSchemas'
import { READING_STATUS_LABELS } from '../utils/readingStatusLabels'

type ShelfControlProps = {
  bookKey: string
  onEntryChange?: (entry: ShelfEntry | undefined) => void
}

type ShelfControlState = {
  identity: string
  entry: ShelfEntry | undefined
  ready: boolean
  failed: boolean
}

type StatusOption = {
  value: ReadingStatus
  Icon: typeof WantIcon
  iconClass: string
  buttonClass: string
  menuClass: string
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'WANT_TO_READ',
    Icon: WantIcon,
    iconClass: 'text-fg',
    buttonClass: 'border-fg bg-raised text-fg hover:bg-sunken',
    menuClass: 'border-fg',
  },
  {
    value: 'CURRENTLY_READING',
    Icon: ReadingIcon,
    iconClass: 'text-brand',
    buttonClass: 'border-brand bg-brand text-on-accent hover:brightness-110',
    menuClass: 'border-brand',
  },
  {
    value: 'FINISHED',
    Icon: ReadIcon,
    iconClass: 'text-read',
    buttonClass: 'border-read bg-read text-white hover:brightness-110',
    menuClass: 'border-read',
  },
  {
    value: 'DROPPED',
    Icon: DroppedIcon,
    iconClass: 'text-dropped',
    buttonClass: 'border-dropped bg-dropped text-white hover:brightness-110',
    menuClass: 'border-dropped',
  },
]

const DEFAULT_STATUS: ReadingStatus = 'WANT_TO_READ'
const UNSHELVED_BUTTON_CLASS = 'border-accent bg-accent text-on-accent hover:bg-accent-hover'
const UNSHELVED_MENU_CLASS = 'border-accent'
const STATUS_ICON_CLASS = 'size-[1.125rem] shrink-0'

export function ShelfControl({ bookKey, onEntryChange }: ShelfControlProps) {
  const { status: authStatus, user } = useAuth()
  const identity = `${authStatus}:${user?.username ?? ''}:${bookKey}`
  const [state, setState] = useState<ShelfControlState>({
    identity: '',
    entry: undefined,
    ready: false,
    failed: false,
  })
  const [pendingIdentity, setPendingIdentity] = useState<string | undefined>(undefined)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const current =
    state.identity === identity
      ? state
      : { identity, entry: undefined, ready: false, failed: false }
  const { entry, ready, failed } = current
  const pending = pendingIdentity === identity
  const reportEntry = useEffectEvent((shelfEntry: ShelfEntry | undefined) =>
    onEntryChange?.(shelfEntry),
  )
  const shownIdentity = useRef(identity)

  useEffect(() => {
    shownIdentity.current = identity
  }, [identity])

  useEffect(() => {
    if (authStatus === 'loading') {
      return
    }
    if (authStatus === 'anonymous') {
      reportEntry(undefined)
      return
    }
    const controller = new AbortController()
    getShelfEntry(bookKey, controller.signal)
      .then((existing) => {
        if (!controller.signal.aborted) {
          setState({ identity, entry: existing, ready: true, failed: false })
          reportEntry(existing)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ identity, entry: undefined, ready: false, failed: true })
          reportEntry(undefined)
        }
      })
    return () => controller.abort()
  }, [authStatus, bookKey, identity])

  const closeMenu = useCallback((reason: DismissReason) => {
    setMenuOpen(false)
    if (reason === 'escape') {
      menuButtonRef.current?.focus()
    }
  }, [])
  useDismiss(menuRef, menuOpen, closeMenu)

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
    setPendingIdentity(identity)
    setState({ ...current, failed: false })
    try {
      const updated = await operation()
      setState({ identity, entry: updated, ready: true, failed: false })
      if (shownIdentity.current === identity) {
        onEntryChange?.(updated)
      }
    } catch {
      setState({ ...current, failed: true })
    } finally {
      setPendingIdentity((pendingFor) => (pendingFor === identity ? undefined : pendingFor))
    }
  }

  async function chooseStatus(value: ReadingStatus) {
    setMenuOpen(false)
    await updateShelf(() => changeShelfStatus(bookKey, value))
  }

  async function toggleFavorite() {
    await updateShelf(() => changeFavorite(bookKey, !favorite))
  }

  async function removeFromShelf() {
    setMenuOpen(false)
    await updateShelf(async () => {
      await removeFromShelfRequest(bookKey)
      return undefined
    })
  }

  const busy = pending || !ready
  const applied = STATUS_OPTIONS.find((option) => option.value === entry?.status)
  const favorite = entry?.favorite ?? false
  const buttonClass = applied?.buttonClass ?? UNSHELVED_BUTTON_CLASS
  const menuClass = applied?.menuClass ?? UNSHELVED_MENU_CLASS

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
              className="flex flex-1 items-center gap-2 py-2.5 pl-4 pr-3 text-left text-sm font-semibold -outline-offset-2"
            >
              <applied.Icon className={STATUS_ICON_CLASS} />
              <span className="flex-1">{READING_STATUS_LABELS[applied.value]}</span>
              <ChevronDownIcon className="size-4" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void chooseStatus(DEFAULT_STATUS)}
                disabled={busy}
                className="flex flex-1 items-center gap-2 py-2.5 pl-4 pr-3 text-left text-sm font-semibold -outline-offset-2"
              >
                <WantIcon className={STATUS_ICON_CLASS} />
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
                className="border-l border-on-accent/25 px-3 -outline-offset-2"
              >
                <ChevronDownIcon className="size-4" />
              </button>
            </>
          )}
        </div>

        {menuOpen ? (
          <div
            role="menu"
            aria-label="Reading status"
            className={`absolute inset-x-0 top-full z-20 rounded-b-md border border-t-0 bg-raised p-1.5 shadow-lg ${menuClass}`}
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
                  className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-fg hover:bg-sunken ${selected ? 'bg-sunken font-semibold' : ''}`}
                >
                  <option.Icon className={`${STATUS_ICON_CLASS} ${option.iconClass}`} />
                  <span className="flex-1">{READING_STATUS_LABELS[option.value]}</span>
                  <span
                    aria-hidden="true"
                    className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${selected ? `border-current ${option.iconClass}` : 'border-fg-3'}`}
                  >
                    {selected ? <span className="size-2 rounded-full bg-current" /> : null}
                  </span>
                </button>
              )
            })}
            {applied ? (
              <div className="mt-1.5 border-t border-rule pt-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void removeFromShelf()}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-fg hover:bg-sunken"
                >
                  <RemoveIcon className={`${STATUS_ICON_CLASS} text-fg-2`} />
                  Remove from shelf
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => void toggleFavorite()}
        disabled={busy}
        aria-pressed={favorite}
        className={`flex items-center justify-center gap-2 rounded-md border border-rule px-4 py-2.5 text-sm font-semibold hover:border-fg-3 hover:text-fg disabled:opacity-50 ${favorite ? 'text-fg' : 'text-fg-2'}`}
      >
        <HeartIcon className={`size-4 ${favorite ? 'text-danger' : ''}`} filled={favorite} />
        {favorite ? 'Favorite' : 'Add to favorites'}
      </button>

      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          {ready
            ? 'Could not save your shelf. Try again.'
            : 'Could not load your shelf. Reload the page.'}
        </p>
      ) : null}
    </div>
  )
}
