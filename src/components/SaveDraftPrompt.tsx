import { useEffect, useId, useRef } from 'react'

import { CLOSE_KEY } from '@/hooks/useDismiss'
import { type LeaveChoice } from '@/hooks/useDraftGuard'
import { draftKindOf } from '@/lib/draftKeys'

import { DialogBackdrop } from './DialogBackdrop'

type SaveDraftPromptProps = {
  keys: readonly string[]
  onAnswer: (choice: LeaveChoice) => void
}

export function SaveDraftPrompt({ keys, onAnswer }: SaveDraftPromptProps) {
  const titleId = useId()
  const textId = useId()
  const saveButton = useRef<HTMLButtonElement>(null)
  const kind = draftKindOf(keys)

  useEffect(() => {
    saveButton.current?.focus({ preventScroll: true })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === CLOSE_KEY) {
        event.stopPropagation()
        onAnswer('cancel')
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [onAnswer])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <DialogBackdrop onClick={() => onAnswer('cancel')} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
        className="relative w-full max-w-sm rounded-md bg-raised p-6 shadow-card"
      >
        <h2 id={titleId} className="font-title text-xl text-fg">
          Save your {kind} as a draft?
        </h2>
        <p id={textId} className="mt-2 text-sm leading-relaxed text-fg-2">
          You have not {kind === 'review' ? 'saved' : 'posted'} it yet. A draft stays on this device
          until you log out.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            ref={saveButton}
            type="button"
            onClick={() => onAnswer('save')}
            className="h-10 rounded-md bg-accent text-sm font-semibold text-on-accent hover:bg-accent-hover"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => onAnswer('discard')}
            className="h-10 rounded-md border border-rule text-sm font-semibold text-danger hover:border-danger"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => onAnswer('cancel')}
            className="h-10 rounded-md text-sm font-semibold text-fg-2 hover:bg-sunken hover:text-fg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
