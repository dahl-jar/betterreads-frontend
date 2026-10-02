import type { ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'

import { httpOnlyUrl } from '@/lib/httpOnlyUrl'

type MarkdownProps = {
  source: string
}

const ALLOWED_ELEMENTS = [
  'p',
  'strong',
  'em',
  'code',
  'a',
  'blockquote',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'br',
]

function HeadingLine({ children }: { children?: ReactNode }) {
  return <p className="font-title text-lg font-bold text-fg">{children}</p>
}

const COMPONENTS: Components = {
  h1: HeadingLine,
  h2: HeadingLine,
  h3: HeadingLine,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  code: ({ children }) => (
    <code className="rounded bg-sunken px-1 font-mono text-[0.9em]">{children}</code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l border-fg-3 pl-4 font-title italic text-fg-2">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
  a: ({ href, children }) =>
    href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-brand underline underline-offset-2"
      >
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
}

export function Markdown({ source }: MarkdownProps) {
  return (
    <div className="flex flex-col gap-3 leading-[1.7] text-fg">
      <ReactMarkdown
        skipHtml
        unwrapDisallowed
        allowedElements={ALLOWED_ELEMENTS}
        urlTransform={httpOnlyUrl}
        components={COMPONENTS}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
