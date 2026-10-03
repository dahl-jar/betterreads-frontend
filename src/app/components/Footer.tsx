import { Link } from 'react-router-dom'

import { CONTACT_LINK, LEGAL_LINKS, type SiteLink } from '@/app/siteLinks'

import { Wordmark } from './Wordmark'

type FooterColumn = {
  heading: string
  links: SiteLink[]
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
    links: [{ label: 'FAQ', to: '/help' }, CONTACT_LINK],
  },
  {
    heading: 'Legal',
    links: LEGAL_LINKS,
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
          We set one cookie to keep you signed in. We use no tracking or advertising cookies. See
          the cookie policy for details.
        </p>
        <p className="mt-2">© {CURRENT_YEAR} BetterReads.</p>
      </div>
    </footer>
  )
}
