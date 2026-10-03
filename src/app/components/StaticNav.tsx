import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { CONTACT_LINK, LEGAL_LINKS, type SiteLink } from '@/app/siteLinks'
import {
  RAIL_CLASS,
  RAIL_ITEM_CLASS,
  RAIL_ITEM_CURRENT_CLASS,
  RAIL_ITEM_OTHER_CLASS,
} from '@/components/railClasses'

type StaticNavGroup = {
  heading: string
  links: SiteLink[]
}

const GROUPS: StaticNavGroup[] = [
  {
    heading: 'BetterReads',
    links: [{ label: 'About', to: '/about' }, { label: 'Help', to: '/help' }, CONTACT_LINK],
  },
  {
    heading: 'Legal',
    links: LEGAL_LINKS,
  },
]

export function StaticNav() {
  const { pathname } = useLocation()

  return (
    <nav aria-label="About and legal" className={RAIL_CLASS}>
      {GROUPS.map((group) => (
        <Fragment key={group.heading}>
          <p className="label-caps hidden px-3 pb-1 pt-4 first:pt-0 lg:block">{group.heading}</p>
          {group.links.map((link) => {
            const current = link.to === pathname
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={current ? 'page' : undefined}
                className={`no-underline ${RAIL_ITEM_CLASS} ${current ? RAIL_ITEM_CURRENT_CLASS : RAIL_ITEM_OTHER_CLASS}`}
              >
                {link.label}
              </Link>
            )
          })}
        </Fragment>
      ))}
    </nav>
  )
}
