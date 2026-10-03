import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { WarningIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'

type DeleteAccountSectionProps = {
  onDeleted: () => void
}

const CONFIRM_WORD = 'delete'

export function DeleteAccountSection({ onDeleted }: DeleteAccountSectionProps) {
  const { deleteAccount } = useAuth()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()

  const confirmed = typed.trim().toLowerCase() === CONFIRM_WORD

  useEffect(() => {
    if (!open) {
      return
    }
    inputRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deleting) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, deleting])

  const close = () => {
    setOpen(false)
    setTyped('')
    setError(false)
  }

  const onConfirm = async () => {
    if (!confirmed) {
      return
    }
    setError(false)
    setDeleting(true)
    try {
      await deleteAccount()
      onDeleted()
    } catch {
      setError(true)
      setDeleting(false)
    }
  }

  return (
    <section className="mt-14 overflow-hidden rounded-[3px] border border-danger/40">
      <h2 className="flex items-center gap-2 border-b border-danger/25 bg-danger/5 px-5 py-3 font-semibold text-danger">
        <WarningIcon className="size-[1.125rem] shrink-0" />
        Delete account
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-5">
        <p className="min-w-0 max-w-[56ch] text-sm text-fg-2">
          <strong className="font-semibold text-fg">This can&apos;t be undone.</strong> Your account
          is disabled at once, and your shelves, ratings, reviews, and comments are removed after 30
          days.{' '}
          <Link to="/privacy" className="font-semibold text-brand underline underline-offset-2">
            What happens to my data
          </Link>
        </p>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setOpen(true)}
          className="px-4"
        >
          Delete my account
        </Button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${inputId}-title`}
            className="w-full max-w-md rounded-lg border border-rule bg-raised p-6 shadow-xl"
          >
            <h3 id={`${inputId}-title`} className="font-title text-lg text-fg">
              Delete your account?
            </h3>
            <p className="mt-2 text-sm text-fg-2">
              This can&apos;t be undone. Your account is disabled now, and your data is removed
              after 30 days.
            </p>

            <label htmlFor={inputId} className="mt-4 block text-sm text-fg-2">
              Type <span className="font-semibold text-fg">{CONFIRM_WORD}</span> to confirm
            </label>
            <Input
              id={inputId}
              ref={inputRef}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="mt-1.5"
            />

            {error ? (
              <p role="alert" className="mt-3 text-sm font-medium text-destructive">
                We couldn&apos;t delete your account just now. Try again in a moment.
              </p>
            ) : null}

            <div className="mt-5 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={close} disabled={deleting}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void onConfirm()}
                disabled={!confirmed || deleting}
              >
                {deleting ? 'Deleting…' : 'Delete account'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
