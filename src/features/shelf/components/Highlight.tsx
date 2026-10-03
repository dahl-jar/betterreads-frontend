import { formatAuthors } from '@/lib/formatAuthors'

import { matchRanges } from '../utils/shelfSearch'

type HighlightProps = {
  text: string
  query: string
}

export function Highlight({ text, query }: HighlightProps) {
  const ranges = matchRanges(text, query)
  if (ranges.length === 0) {
    return text
  }
  const parts = ranges.flatMap(([start, end], index) => {
    const previousEnd = ranges[index - 1]?.[1] ?? 0
    return [
      text.slice(previousEnd, start),
      <mark key={start} className="rounded-[2px] bg-brand-soft text-brand">
        {text.slice(start, end)}
      </mark>,
    ]
  })
  const lastEnd = ranges.at(-1)?.[1] ?? 0
  return (
    <>
      {parts}
      {text.slice(lastEnd)}
    </>
  )
}

export function HighlightedAuthors({ authors, query }: { authors: string[]; query: string }) {
  return <Highlight text={formatAuthors(authors)} query={query} />
}
