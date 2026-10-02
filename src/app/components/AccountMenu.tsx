import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Avatar } from '@/components/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { useDismiss } from '@/hooks/useDismiss'

type AccountMenuProps = {
  username: string
  displayName?: string | null | undefined
  avatarUrl?: string | null | undefined
}

const MENU_LINKS = [
  { to: '/shelf', label: 'My books', phoneOnly: true },
  { to: '/profile', label: 'Profile', phoneOnly: false },
  { to: '/settings', label: 'Settings', phoneOnly: false },
] as const

export function AccountMenu({ username, displayName, avatarUrl }: AccountMenuProps) {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const name = displayName ?? username

  const close = useCallback(() => setOpen(false), [])
  useDismiss(menuRef, open, close)

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center rounded-full transition hover:opacity-80"
      >
        <Avatar name={name} url={avatarUrl} size="md" />
      </button>

      {open ? (
        <>
          <div
            aria-hidden="true"
            data-testid="account-menu-backdrop"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-fg/40 md:hidden"
          />
          <div className="fixed right-0 top-0 z-40 flex h-full w-72 flex-col bg-raised shadow-xl md:absolute md:left-1/2 md:right-auto md:top-full md:z-20 md:mt-3.5 md:h-auto md:w-48 md:-translate-x-1/2 md:rounded-lg md:border md:border-rule md:shadow-none">
            <span
              aria-hidden="true"
              className="absolute left-1/2 -top-2 hidden h-4 w-4 -translate-x-1/2 rotate-45 rounded-[3px] border-l border-t border-rule bg-raised md:block"
            />
            <div role="menu" className="relative flex h-full flex-col md:overflow-hidden">
              <div className="flex items-center gap-3 border-b border-rule px-4 py-4 md:px-3 md:py-2">
                <span className="md:hidden">
                  <Avatar name={name} url={avatarUrl} size="md" />
                </span>
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="min-w-0 flex-1 no-underline"
                >
                  <span className="block truncate font-title text-base font-semibold text-fg md:text-sm">
                    {name}
                  </span>
                  <span className="block truncate text-sm text-fg-2 md:hidden">@{username}</span>
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="-mr-1 shrink-0 p-1 text-2xl leading-none text-fg-2 hover:text-fg md:hidden"
                >
                  &times;
                </button>
              </div>
              <div className="py-1.5 md:py-1">
                {MENU_LINKS.map((link) => (
                  <span key={link.to} className={link.phoneOnly ? 'sm:hidden' : undefined}>
                    <MenuLink to={link.to} onSelect={() => setOpen(false)}>
                      {link.label}
                    </MenuLink>
                  </span>
                ))}
              </div>
              <div className="mt-auto border-t border-rule py-1.5 md:mt-0 md:py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    void logout()
                  }}
                  className="block w-full px-4 py-3 text-left text-base font-medium text-destructive transition-colors hover:bg-sunken md:px-3 md:py-1.5 md:text-xs"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function MenuLink({
  to,
  onSelect,
  children,
}: {
  to: string
  onSelect: () => void
  children: string
}) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onSelect}
      className="block px-4 py-3 text-base text-fg no-underline transition-colors hover:bg-sunken md:px-3 md:py-1.5 md:text-xs"
    >
      {children}
    </Link>
  )
}
