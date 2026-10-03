import { Link } from 'react-router-dom'

type WordmarkProps = {
  className: string
}

export function Wordmark({ className }: WordmarkProps) {
  return (
    <Link to="/" className={`${className} tracking-tight whitespace-nowrap text-fg no-underline`}>
      <svg
        viewBox="0 0 40 40"
        aria-hidden="true"
        className="mr-[-0.03em] inline-block size-[1.4em] align-[-0.35em]"
      >
        <rect x="3" y="3" width="34" height="34" rx="4" className="fill-brand" />
        <text
          x="20"
          y="30"
          textAnchor="middle"
          fontWeight="700"
          fontSize="28"
          className="fill-on-accent font-title"
        >
          b
        </text>
      </svg>
      <span className="sr-only">b</span>
      <span className="font-title">
        etter<b className="font-bold">Reads</b>
      </span>
    </Link>
  )
}
