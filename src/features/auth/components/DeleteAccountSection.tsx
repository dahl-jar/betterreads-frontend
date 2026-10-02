import { useEffect, useId, useRef, useState } from 'react'

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
    <section className="mt-10 rounded-md border border-destructive/40 p-5">
      <h2 className="font-semibold text-fg">Delete account</h2>
      <p className="mt-1 text-sm text-fg-2">
        Deleting your account immediately disables it and signs out this browser. It cannot be
        restored. Another signed-in device may keep access for up to two hours. Your account,
        shelves, notes, reviews, ratings, comments, and replies are deleted from the live service
        after 30 days. Until then, reviews and ratings remain public without your identity, and your
        username is removed from comments and replies. Encrypted backups may retain the data for
        about another 30 days.
      </p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="mt-4 border-destructive text-destructive hover:bg-destructive/5 hover:text-destructive"
      >
        Delete my account
      </Button>

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
              This immediately disables your account and signs out this browser. It cannot be
              restored. Another signed-in device may keep access for up to two hours. Your
              BetterReads account data is deleted from the live service after 30 days, and encrypted
              backups may retain it for about another 30 days.
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
