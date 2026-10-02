import { Link } from 'react-router-dom'

type WordmarkProps = {
  className: string
}

export function Wordmark({ className }: WordmarkProps) {
  return (
    <Link to="/" className={`${className} tracking-tight text-fg no-underline`}>
      better<b className="font-extrabold">reads</b>
    </Link>
  )
}
