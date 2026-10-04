import { type ReactNode, useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { DraftStatus } from '@/components/DraftStatus'
import { BulletListIcon, LinkIcon, NumberedListIcon, QuoteIcon } from '@/components/icons'
import { Markdown } from '@/components/Markdown'
import { StarRating } from '@/components/StarRating'
import { type Draft } from '@/lib/draftStore'
import { formatCount } from '@/lib/formatCount'

import { REVIEW_BODY_MAX, REVIEW_TITLE_MAX, type Review } from '../api/reviewSchemas'
import { applyFormat, type FormatKind } from '../utils/applyFormat'

type ReviewText = {
  title: string
  body: string
}

type ReviewEditorProps = {
  review: Review | undefined
  draft?: Draft | undefined
  rating: number
  pending: boolean
  onRate: (rating: number) => void
  onSubmit: (text: ReviewText) => void
  onCancel: () => void
  onTextChange?: ((field: keyof ReviewText, value: string) => void) | undefined
}

type EditorTab = 'write' | 'preview'

const BODY_MAX_LABEL = formatCount(REVIEW_BODY_MAX)
const ICON_CLASS = 'size-[1.125rem]'

const TABS: { id: EditorTab; label: string }[] = [
  { id: 'write', label: 'Write' },
  { id: 'preview', label: 'Preview' },
]

const FORMATS: { kind: FormatKind; label: string; icon: ReactNode }[] = [
  { kind: 'bold', label: 'Bold', icon: <span className="text-sm font-bold">B</span> },
  {
    kind: 'italic',
    label: 'Italic',
    icon: <span className="font-title text-sm italic">I</span>,
  },
  { kind: 'quote', label: 'Quote', icon: <QuoteIcon className={ICON_CLASS} /> },
  { kind: 'ul', label: 'Bulleted list', icon: <BulletListIcon className={ICON_CLASS} /> },
  { kind: 'ol', label: 'Numbered list', icon: <NumberedListIcon className={ICON_CLASS} /> },
  { kind: 'link', label: 'Link', icon: <LinkIcon className={ICON_CLASS} /> },
]

function startingText(review: Review | undefined, draft: Draft | undefined): ReviewText {
  if (draft) {
    return { title: draft.title ?? '', body: draft.body }
  }
  return { title: review?.title ?? '', body: review?.body ?? '' }
}

export function ReviewEditor({
  review,
  draft,
  rating,
  pending,
  onRate,
  onSubmit,
  onCancel,
  onTextChange,
}: ReviewEditorProps) {
  const [title, setTitle] = useState(() => startingText(review, draft).title)
  const [body, setBody] = useState(() => startingText(review, draft).body)
  const [tab, setTab] = useState<EditorTab>('write')
  const bodyArea = useRef<HTMLTextAreaElement>(null)
  const titleId = useId()
  const bodyLabelId = useId()
  const rated = rating > 0

  function changeTitle(value: string) {
    setTitle(value)
    onTextChange?.('title', value)
  }

  function changeBody(value: string) {
    setBody(value)
    onTextChange?.('body', value)
  }

  function format(kind: FormatKind) {
    const area = bodyArea.current
    if (!area) {
      return
    }
    const formatted = applyFormat(
      { value: body, start: area.selectionStart, end: area.selectionEnd },
      kind,
    )
    if (formatted.value.length > REVIEW_BODY_MAX) {
      return
    }
    flushSync(() => changeBody(formatted.value))
    area.focus()
    area.setSelectionRange(formatted.start, formatted.end)
  }

  return (
    <div>
      <p className="mt-5 text-sm font-semibold text-fg">Your rating</p>
      <div className="mt-1.5">
        <StarRating value={rating} onRate={onRate} disabled={pending} />
      </div>

      <p className="mt-5 text-sm text-fg-3">
        <label htmlFor={titleId} className="font-semibold text-fg">
          Title
        </label>{' '}
        (optional)
      </p>
      <input
        id={titleId}
        value={title}
        maxLength={REVIEW_TITLE_MAX}
        onChange={(event) => changeTitle(event.target.value)}
        className="mt-1.5 h-11 w-full rounded-md border border-rule bg-raised px-3 text-fg outline-none focus:border-fg-2"
      />

      <p id={bodyLabelId} className="mt-5 text-sm font-semibold text-fg">
        Review
      </p>
      <div className="mt-1.5 overflow-hidden rounded-md border border-rule focus-within:border-fg-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule bg-sunken px-2 py-1.5">
          <div role="tablist" aria-label="Editor view" className="flex gap-1">
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={tab === entry.id}
                onClick={() => setTab(entry.id)}
                className={`rounded px-2.5 py-1 text-sm font-semibold ${
                  tab === entry.id ? 'bg-raised text-fg shadow-sm' : 'text-fg-2 hover:text-fg'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
          {tab === 'write' ? (
            <div role="toolbar" aria-label="Formatting" className="flex gap-0.5">
              {FORMATS.map((entry) => (
                <button
                  key={entry.kind}
                  type="button"
                  aria-label={entry.label}
                  title={entry.label}
                  onClick={() => format(entry.kind)}
                  className="flex size-8 items-center justify-center rounded text-fg-2 hover:bg-raised hover:text-fg"
                >
                  {entry.icon}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {tab === 'write' ? (
          <textarea
            ref={bodyArea}
            value={body}
            rows={10}
            maxLength={REVIEW_BODY_MAX}
            aria-labelledby={bodyLabelId}
            placeholder="What did you think of it?"
            onChange={(event) => changeBody(event.target.value)}
            className="block w-full resize-y bg-raised px-3.5 py-3 font-mono leading-[1.7] text-fg outline-none placeholder:text-fg-3"
          />
        ) : (
          <div className="min-h-[17rem] bg-raised px-3.5 py-3">
            {body.trim() === '' ? (
              <p className="text-fg-3">Nothing to preview yet.</p>
            ) : (
              <Markdown source={body} />
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-rule px-3.5 py-2 text-xs text-fg-3">
          <span>Markdown works here: **bold**, *italic*, &gt; quote, - list, [link](url)</span>
          <span>{`${formatCount(body.length)} / ${BODY_MAX_LABEL}`}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={() => onSubmit({ title: title.trim(), body: body.trim() })}
          disabled={pending || !rated}
          className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-40"
        >
          Save review
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-semibold text-fg-2 hover-mark"
        >
          Cancel
        </button>
        {rated ? null : (
          <span className="text-sm text-fg-3">Rate the book to save your review.</span>
        )}
        <span className="ml-auto">
          <DraftStatus draft={draft} />
        </span>
      </div>
    </div>
  )
}
