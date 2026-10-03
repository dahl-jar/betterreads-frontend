import { useState } from 'react'

import { type ShelfEntry } from '../api/shelfSchemas'

import { useShelf } from './useShelf'

type EntryChanges = Record<string, ShelfEntry | null>

type ShelfEntries = {
  status: ReturnType<typeof useShelf>['status']
  entries: ShelfEntry[]
  changeFor: (key: string) => (updated: ShelfEntry | undefined) => void
  rateFor: (entry: ShelfEntry) => (rating: number) => Promise<void>
}

function applyChanges(loaded: ShelfEntry[], changes: EntryChanges): ShelfEntry[] {
  return loaded.flatMap((entry) => {
    const changed = changes[entry.key]
    if (changed === null) {
      return []
    }
    return [changed ?? entry]
  })
}

export function useShelfEntries(
  onRate: (key: string, rating: number) => Promise<void>,
): ShelfEntries {
  const { status, entries: loaded } = useShelf()
  const [changes, setChanges] = useState<EntryChanges>({})

  const changeFor = (key: string) => (updated: ShelfEntry | undefined) => {
    setChanges((previous) => ({ ...previous, [key]: updated ?? null }))
  }

  const rateFor = (entry: ShelfEntry) => async (rating: number) => {
    await onRate(entry.key, rating)
    setChanges((previous) => {
      const current = previous[entry.key]
      if (current === null) {
        return previous
      }
      return { ...previous, [entry.key]: { ...(current ?? entry), myRating: rating } }
    })
  }

  return { status, entries: applyChanges(loaded, changes), changeFor, rateFor }
}
