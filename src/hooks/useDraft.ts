import { useCallback, useSyncExternalStore } from 'react'

import {
  type Draft,
  hasDraftText,
  readDraft,
  removeDraft,
  subscribeDrafts,
  writeDraft,
} from '@/lib/draftStore'

import { useAuth } from './useAuth'
import { useDraftGuard } from './useDraftGuard'

type DraftField = 'title' | 'body'

type DraftHandle = {
  draft: Draft | undefined
  update: (field: DraftField, value: string) => void
  discard: () => void
}

export function useDraft(key: string): DraftHandle {
  const { user } = useAuth()
  const owner = user?.username
  const { markTouched } = useDraftGuard()
  const draft = useSyncExternalStore(subscribeDrafts, () =>
    owner === undefined ? undefined : readDraft(owner, key),
  )

  const update = useCallback(
    (field: DraftField, value: string) => {
      if (owner === undefined) {
        return
      }
      const next: Draft = {
        body: '',
        ...readDraft(owner, key),
        [field]: value,
        savedAt: Date.now(),
      }
      if (hasDraftText(next)) {
        writeDraft(owner, key, next)
      } else {
        removeDraft(owner, key)
      }
      markTouched(key)
    },
    [owner, key, markTouched],
  )

  const discard = useCallback(() => {
    if (owner !== undefined) {
      removeDraft(owner, key)
    }
  }, [owner, key])

  return { draft, update, discard }
}
