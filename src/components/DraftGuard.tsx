import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import {
  type DraftGuard,
  DraftGuardContext,
  type LeaveChoice,
  useDraftGuard,
} from '@/hooks/useDraftGuard'
import { hasDraftText, readDraft, removeDraft } from '@/lib/draftStore'

import { SaveDraftPrompt } from './SaveDraftPrompt'

type PendingLeave = {
  keys: readonly string[]
  resolve: (choice: LeaveChoice) => void
}

export function DraftGuardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const owner = user?.username
  const touched = useRef(new Set<string>())
  const [pending, setPending] = useState<PendingLeave | undefined>(undefined)

  const withText = useCallback(
    (keys: readonly string[]) =>
      owner === undefined ? [] : keys.filter((key) => hasDraftText(readDraft(owner, key))),
    [owner],
  )

  const markTouched = useCallback((key: string) => {
    touched.current.add(key)
  }, [])

  const touchedKeys = useCallback(() => [...touched.current], [])

  const hasUnpostedDrafts = useCallback(() => withText([...touched.current]).length > 0, [withText])

  const confirmLeave = useCallback(
    (keys: readonly string[]) => {
      const written = withText(keys)
      if (written.length === 0) {
        keys.forEach((key) => touched.current.delete(key))
        return Promise.resolve<LeaveChoice>('save')
      }
      return new Promise<LeaveChoice>((resolve) => setPending({ keys: written, resolve }))
    },
    [withText],
  )

  const answer = useCallback(
    (choice: LeaveChoice) => {
      if (!pending) {
        return
      }
      setPending(undefined)
      if (choice !== 'cancel') {
        pending.keys.forEach((key) => {
          touched.current.delete(key)
          if (choice === 'discard' && owner !== undefined) {
            removeDraft(owner, key)
          }
        })
      }
      pending.resolve(choice)
    },
    [pending, owner],
  )

  const guard = useMemo<DraftGuard>(
    () => ({ markTouched, touchedKeys, hasUnpostedDrafts, confirmLeave }),
    [markTouched, touchedKeys, hasUnpostedDrafts, confirmLeave],
  )

  return (
    <DraftGuardContext value={guard}>
      {children}
      {pending ? <SaveDraftPrompt keys={pending.keys} onAnswer={answer} /> : null}
    </DraftGuardContext>
  )
}

export function DraftNavigationGuard() {
  const { hasUnpostedDrafts, touchedKeys, confirmLeave } = useDraftGuard()
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname && hasUnpostedDrafts(),
  )

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return
    }
    void confirmLeave(touchedKeys()).then((choice) => {
      if (choice === 'cancel') {
        blocker.reset()
      } else {
        blocker.proceed()
      }
    })
  }, [blocker, confirmLeave, touchedKeys])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnpostedDrafts()) {
        event.preventDefault()
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasUnpostedDrafts])

  return null
}
