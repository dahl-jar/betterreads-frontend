import { Link } from 'react-router-dom'

type FooterLink = {
  label: string
  to: string
  external?: boolean
}

type FooterColumn = {
  heading: string
  links: FooterLink[]
}

const COLUMNS: FooterColumn[] = [
  {
    heading: 'About',
    links: [
      { label: 'Our story', to: '/about' },
      { label: 'How it works', to: '/about#how' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { label: 'FAQ', to: '/help' },
      { label: 'Contact', to: '/help#contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy policy', to: '/privacy' },
      { label: 'Cookie policy', to: '/cookies' },
      { label: 'Terms of service', to: '/terms' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-14 bg-ink text-paper/80">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Link to="/" className="text-xl text-paper no-underline">
            better<b className="font-extrabold">reads</b>
          </Link>
          <p className="mt-3 max-w-60 text-sm">Track your reading and find your next book.</p>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-paper">
              {column.heading}
            </h2>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-paper/80 no-underline hover:text-paper"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto max-w-5xl px-6 pb-10">
        <p className="border-t border-paper/15 pt-6 text-xs text-paper/60">
          We set one 30-day cookie to renew your session when you return or reload a page. We use no
          tracking or advertising cookies. See the cookie policy for details.
        </p>
        <p className="mt-3 text-xs text-paper/50">© 2026 BetterReads.</p>
      </div>
    </footer>
  )
}
