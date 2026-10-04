import { useEffect, useId, useRef, useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { BookCover } from '@/components/BookCover'
import { DialogBackdrop } from '@/components/DialogBackdrop'
import { ChevronLeftIcon, ChevronRightIcon, ClearIcon } from '@/components/icons'
import { Markdown } from '@/components/Markdown'
import { StarRating } from '@/components/StarRating'
import { CLOSE_KEY } from '@/hooks/useDismiss'
import { useDraftGuard } from '@/hooks/useDraftGuard'
import { formatDate } from '@/lib/formatDate'

import { ReadDates } from './ReadDates'
import {
  type OpenReview,
  type RenderComments,
  type ReviewSection,
  type ReviewWindowItem,
} from './reviewWindowItem'

const ROUND_BUTTON =
  'flex size-9 items-center justify-center rounded-full border border-rule text-fg-2 transition-colors hover:border-fg-3 hover:text-fg disabled:opacity-35'

type ReviewWindowProps = {
  items: readonly ReviewWindowItem[]
  openId: number
  section?: ReviewSection | undefined
  onOpen: OpenReview
  onClose: () => void
  renderComments?: RenderComments | undefined
}

export function ReviewWindow({
  items,
  openId,
  section,
  onOpen,
  onClose,
  renderComments,
}: ReviewWindowProps) {
  const titleId = useId()
  const { confirmLeave, touchedKeys } = useDraftGuard()
  const [touchedBeforeOpen] = useState(() => new Set(touchedKeys()))
  const closeButton = useRef<HTMLButtonElement>(null)
  const pane = useRef<HTMLDivElement>(null)
  const comments = useRef<HTMLElement>(null)
  const index = items.findIndex((item) => item.review.id === openId)
  const current = items[index]

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = previousOverflow
      opener?.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    if (!pane.current) {
      return
    }
    pane.current.scrollTop =
      section === 'comments' && comments.current
        ? comments.current.offsetTop - pane.current.offsetTop
        : 0
  }, [openId, section])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === CLOSE_KEY) {
        void leaveThen(onClose)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  })

  async function leaveThen(action: () => void) {
    const touchedHere = touchedKeys().filter((key) => !touchedBeforeOpen.has(key))
    if ((await confirmLeave(touchedHere)) !== 'cancel') {
      action()
    }
  }

  if (!current) {
    return null
  }

  const { review, book } = current
  const previous = items[index - 1]
  const next = items[index + 1]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <DialogBackdrop onClick={() => void leaveThen(onClose)} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-xl bg-raised shadow-card sm:h-auto sm:max-h-[90vh] sm:rounded-md"
      >
        <div className="flex items-center gap-3 border-b border-rule px-4 py-3 sm:px-6">
          <BookCover
            coverUrl={book.coverUrl}
            title={book.title}
            className="h-12 w-8 shrink-0 rounded-[2px] shadow-cover"
          />
          <div className="min-w-0 flex-1 leading-snug">
            <p id={titleId} className="truncate font-title text-[0.9375rem] text-fg">
              {book.title}
            </p>
            <p className="truncate text-xs text-fg-3">{review.author}&apos;s review</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous review"
              disabled={!previous}
              onClick={() => previous && void leaveThen(() => onOpen(previous.review.id))}
              className={ROUND_BUTTON}
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next review"
              disabled={!next}
              onClick={() => next && void leaveThen(() => onOpen(next.review.id))}
              className={ROUND_BUTTON}
            >
              <ChevronRightIcon className="size-4" />
            </button>
            <button
              ref={closeButton}
              type="button"
              aria-label="Close"
              onClick={() => void leaveThen(onClose)}
              className="flex size-9 items-center justify-center rounded-full bg-sunken text-fg transition-colors hover:bg-rule"
            >
              <ClearIcon className="size-4" />
            </button>
          </div>
        </div>

        <div ref={pane} className="min-h-0 flex-1 overflow-y-auto px-5 pt-6 sm:px-8">
          <div className="flex items-center gap-3">
            <Avatar name={review.author} />
            <p className="min-w-0 truncate font-semibold text-fg">{review.author}</p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {review.rating ? <StarRating value={review.rating} /> : null}
            <time className="text-sm text-fg-3" dateTime={review.createdAt}>
              {formatDate(review.createdAt)}
            </time>
          </div>
          {review.title ? (
            <h2 className="mt-3 font-title text-2xl font-bold leading-tight tracking-tight text-balance text-fg">
              {review.title}
            </h2>
          ) : (
            <h2 className="sr-only">{review.author}&apos;s review</h2>
          )}
          {review.body ? (
            <div className="mt-4 max-w-[68ch] text-[1.0625rem] [&>div]:leading-[1.75]">
              <Markdown source={review.body} />
            </div>
          ) : null}
          <ReadDates startedAt={review.readStartedAt} finishedAt={review.readFinishedAt} />

          <section ref={comments} aria-label="Comments" className="mt-10">
            <h3 className="font-title text-xl text-fg">Comments</h3>
            <div key={review.id} className="pb-4">
              {renderComments?.(review.id)}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
