export type TextSelection = {
  value: string
  start: number
  end: number
}

export type FormatKind = 'bold' | 'italic' | 'quote' | 'ul' | 'ol' | 'link'

type Wrap = {
  before: string
  after: string
  placeholder: string
}

const WRAPS: Record<'bold' | 'italic' | 'link', Wrap> = {
  bold: { before: '**', after: '**', placeholder: 'bold text' },
  italic: { before: '*', after: '*', placeholder: 'italic text' },
  link: { before: '[', after: '](https://)', placeholder: 'link text' },
}

type LineMark = (index: number) => string

const LINE_BREAK = '\n'

const LINE_MARKS: Record<'quote' | 'ul' | 'ol', LineMark> = {
  quote: () => '> ',
  ul: () => '- ',
  ol: (index) => `${index + 1}. `,
}

function wrap({ value, start, end }: TextSelection, { before, after, placeholder }: Wrap) {
  const inner = value.slice(start, end) || placeholder
  const innerStart = start + before.length
  return {
    value: `${value.slice(0, start)}${before}${inner}${after}${value.slice(end)}`,
    start: innerStart,
    end: innerStart + inner.length,
  }
}

function wrapLines({ value, start, end }: TextSelection, { before, after }: Wrap) {
  const wrapped = value
    .slice(start, end)
    .split(LINE_BREAK)
    .map((line) => (line.trim() === '' ? line : `${before}${line}${after}`))
    .join(LINE_BREAK)
  return {
    value: `${value.slice(0, start)}${wrapped}${value.slice(end)}`,
    start,
    end: start + wrapped.length,
  }
}

function prefixLines({ value, start, end: selectionEnd }: TextSelection, mark: LineMark) {
  const lineStart = value.lastIndexOf(LINE_BREAK, start - 1) + 1
  const endsOnBreak = selectionEnd > start && value[selectionEnd - 1] === LINE_BREAK
  const lastTouched = endsOnBreak ? selectionEnd - 1 : selectionEnd
  const nextBreak = value.indexOf(LINE_BREAK, lastTouched)
  const end = nextBreak === -1 ? value.length : nextBreak
  const prefixed = value
    .slice(lineStart, end)
    .split(LINE_BREAK)
    .map((line, index) => `${mark(index)}${line}`)
    .join(LINE_BREAK)
  const caret = lineStart + prefixed.length
  return {
    value: `${value.slice(0, lineStart)}${prefixed}${value.slice(end)}`,
    start: caret,
    end: caret,
  }
}

export function applyFormat(text: TextSelection, kind: FormatKind): TextSelection {
  if (kind === 'link') {
    return wrap(text, WRAPS[kind])
  }
  if (kind === 'bold' || kind === 'italic') {
    const spansLines = text.value.slice(text.start, text.end).includes(LINE_BREAK)
    return spansLines ? wrapLines(text, WRAPS[kind]) : wrap(text, WRAPS[kind])
  }
  return prefixLines(text, LINE_MARKS[kind])
}
