import { useState } from 'react'

type ShowMoreTextProps = {
  text: string
  collapsedChars?: number
  className?: string
}

const DEFAULT_COLLAPSED_CHARS = 420

export function ShowMoreText({
  text,
  collapsedChars = DEFAULT_COLLAPSED_CHARS,
  className,
}: ShowMoreTextProps) {
  const [expanded, setExpanded] = useState(false)
  const needsToggle = text.length > collapsedChars

  if (!needsToggle) {
    return <p className={className}>{text}</p>
  }

  const shown = expanded ? text : `${cutAtWord(text, collapsedChars)}…`

  return (
    <div>
      <p className={className}>{shown}</p>
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="mt-1 text-sm font-semibold text-brand hover-mark"
        aria-expanded={expanded}
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  )
}

function cutAtWord(text: string, limit: number): string {
  const slice = text.slice(0, limit)
  const lastSpace = slice.lastIndexOf(' ')
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trimEnd()
}
