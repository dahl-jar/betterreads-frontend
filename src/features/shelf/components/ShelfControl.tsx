import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'

import { changeFavorite } from '../api/changeFavorite'
import { changeShelfStatus } from '../api/changeShelfStatus'
import { getShelfEntry } from '../api/getShelfEntry'
import { removeFromShelf as removeFromShelfRequest } from '../api/removeFromShelf'
import { type ReadingStatus, type ShelfEntry } from '../api/shelfSchemas'

type ShelfControlProps = {
  bookKey: string
}

type ShelfControlState = {
  identity: string
  entry: ShelfEntry | undefined
  ready: boolean
  failed: boolean
}

const STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: 'WANT_TO_READ', label: 'Want to read' },
  { value: 'CURRENTLY_READING', label: 'Currently reading' },
  { value: 'FINISHED', label: 'Read' },
  { value: 'DROPPED', label: 'Dropped' },
]

const DEFAULT_STATUS: ReadingStatus = 'WANT_TO_READ'

function labelFor(status: ReadingStatus): string {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'Want to read'
}

export function ShelfControl({ bookKey }: ShelfControlProps) {
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
  const current =
    state.identity === identity
      ? state
      : { identity, entry: undefined, ready: false, failed: false }
  const { entry, ready, failed } = current
  const pending = pendingIdentity === identity

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      return
    }
    const controller = new AbortController()
    getShelfEntry(bookKey, controller.signal)
      .then((existing) => {
        if (!controller.signal.aborted) {
          setState({ identity, entry: existing, ready: true, failed: false })
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ identity, entry: undefined, ready: false, failed: true })
        }
      })
    return () => controller.abort()
  }, [authStatus, bookKey, identity])

  useEffect(() => {
    if (!menuOpen) {
      return
    }
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [menuOpen])

  if (authStatus !== 'authenticated') {
    return (
      <Link
        to="/login"
        className="block w-full rounded-md border border-green px-4 py-2.5 text-center text-sm font-semibold text-green hover:bg-green-soft"
      >
        Sign in to track this book
      </Link>
    )
  }

  async function updateShelf(operation: () => Promise<ShelfEntry | undefined>) {
    setPendingIdentity(identity)
    setState({ ...current, failed: false })
    try {
      const updated = await operation()
      setState({ identity, entry: updated, ready: true, failed: false })
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
    await updateShelf(() => changeFavorite(bookKey, !(entry?.favorite ?? false)))
  }

  async function removeFromShelf() {
    setMenuOpen(false)
    await updateShelf(async () => {
      await removeFromShelfRequest(bookKey)
      return undefined
    })
  }

  const busy = pending || !ready
  const shelved = entry !== undefined
  const primaryLabel = shelved ? labelFor(entry.status) : 'Want to read'
  const faceColor = shelved
    ? 'border border-green bg-green-soft text-green-deep hover:bg-green hover:text-white'
    : 'bg-green text-white hover:bg-green-deep'

  return (
    <div className="flex flex-col gap-2">
      <div ref={menuRef} className="relative">
        <div className="flex">
          <button
            type="button"
            onClick={() => void chooseStatus(entry?.status ?? DEFAULT_STATUS)}
            disabled={busy}
            className={`flex flex-1 items-center gap-1.5 rounded-l-md border-r-0 px-4 py-2.5 text-left text-sm font-semibold disabled:opacity-50 ${faceColor}`}
          >
            {shelved ? <span aria-hidden="true">✓</span> : null}
            {primaryLabel}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            disabled={busy}
            aria-label="Choose shelf"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={`rounded-r-md px-3 py-2.5 disabled:opacity-50 ${faceColor}`}
          >
            <span aria-hidden="true">▾</span>
          </button>
        </div>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-card"
          >
            {STATUS_OPTIONS.map((option) => {
              const active = entry?.status === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitem"
                  onClick={() => void chooseStatus(option.value)}
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-ink hover:bg-green-soft"
                >
                  {option.label}
                  {active ? <span className="text-green">✓</span> : null}
                </button>
              )
            })}
            {shelved ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => void removeFromShelf()}
                className="w-full border-t border-line px-4 py-2 text-left text-sm text-destructive hover:bg-muted"
              >
                Remove from shelf
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => void toggleFavorite()}
        disabled={busy}
        aria-pressed={entry?.favorite ?? false}
        className="flex items-center justify-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-muted disabled:opacity-50"
      >
        <span className={entry?.favorite ? 'text-rust' : ''} aria-hidden="true">
          {entry?.favorite ? '★' : '☆'}
        </span>
        {entry?.favorite ? 'Favorite' : 'Add to favorites'}
      </button>

      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          Could not save your shelf. Try again.
        </p>
      ) : null}
    </div>
  )
}
