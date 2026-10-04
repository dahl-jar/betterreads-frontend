import { type Draft } from '@/lib/draftStore'

import { CheckIcon } from './icons'

const SAVED_TIME = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

const SAVED_DAY = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

function savedLabel(savedAt: number): string {
  const saved = new Date(savedAt)
  return saved.toDateString() === new Date().toDateString()
    ? `Draft saved ${SAVED_TIME.format(saved)}`
    : `Draft from ${SAVED_DAY.format(saved)}`
}

export function DraftStatus({ draft }: { draft: Draft | undefined }) {
  if (!draft) {
    return null
  }
  return (
    <span className="flex min-w-0 items-center gap-1 text-xs text-fg-3">
      <CheckIcon className="size-3.5 shrink-0" />
      {savedLabel(draft.savedAt)}
    </span>
  )
}
