import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { type AuthStatus, useAuth } from '@/hooks/useAuth'

import { getShelfEntry } from '../api/getShelfEntry'
import { type ShelfEntry } from '../api/shelfSchemas'

type EntryState = {
  identity: string
  entry: ShelfEntry | undefined
  ready: boolean
  failed: boolean
}

type ShelfEntryControl = {
  authStatus: AuthStatus
  entry: ShelfEntry | undefined
  ready: boolean
  failed: boolean
  busy: boolean
  update: (operation: () => Promise<ShelfEntry | undefined>) => Promise<void>
}

export function useShelfEntry(
  bookKey: string,
  seed: ShelfEntry | undefined,
  onEntryChange: ((entry: ShelfEntry | undefined) => void) | undefined,
): ShelfEntryControl {
  const { status: authStatus, user } = useAuth()
  const identity = `${authStatus}:${user?.username ?? ''}:${bookKey}`
  const [state, setState] = useState<EntryState>({
    identity: '',
    entry: undefined,
    ready: false,
    failed: false,
  })
  const [pendingIdentity, setPendingIdentity] = useState<string | undefined>(undefined)
  const seeded = seed !== undefined
  const current =
    state.identity === identity ? state : { identity, entry: seed, ready: seeded, failed: false }
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
    if (seeded) {
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
  }, [authStatus, bookKey, identity, seeded])

  async function update(operation: () => Promise<ShelfEntry | undefined>) {
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

  return {
    authStatus,
    entry: current.entry,
    ready: current.ready,
    failed: current.failed,
    busy: pendingIdentity === identity || !current.ready,
    update,
  }
}
