import { createContext, useContext } from 'react'

export type LeaveChoice = 'save' | 'discard' | 'cancel'

export type DraftGuard = {
  markTouched: (key: string) => void
  touchedKeys: () => readonly string[]
  hasUnpostedDrafts: () => boolean
  confirmLeave: (keys: readonly string[]) => Promise<LeaveChoice>
}

const LEAVE_WITHOUT_ASKING: DraftGuard = {
  markTouched: () => undefined,
  touchedKeys: () => [],
  hasUnpostedDrafts: () => false,
  confirmLeave: () => Promise.resolve('save'),
}

export const DraftGuardContext = createContext<DraftGuard>(LEAVE_WITHOUT_ASKING)

export function useDraftGuard(): DraftGuard {
  return useContext(DraftGuardContext)
}
