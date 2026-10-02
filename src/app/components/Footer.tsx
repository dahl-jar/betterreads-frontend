import { Link } from 'react-router-dom'

import { Wordmark } from './Wordmark'

type FooterLink = {
  label: string
  to: string
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

const CURRENT_YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="mt-16 border-t border-rule">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div>
          <Wordmark className="text-lg" />
          <p className="mt-2 max-w-[24ch] text-sm text-fg-2">
            Track your reading and find your next book.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-fg-3">
              {column.heading}
            </h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-fg-2 no-underline hover:text-fg">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto max-w-6xl border-t border-rule px-5 py-6 text-xs text-fg-3">
        <p>
          We set one 30-day cookie to renew your session when you return or reload a page. We use no
          tracking or advertising cookies. See the cookie policy for details.
        </p>
        <p className="mt-2">© {CURRENT_YEAR} BetterReads.</p>
      </div>
    </footer>
  )
}
