import { type ComponentType, useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Avatar } from '@/components/Avatar'
import { BooksIcon, ChevronDownIcon, HelpIcon, LogoutIcon, SettingsIcon } from '@/components/icons'
import { useAuth } from '@/hooks/useAuth'
import { useDismiss } from '@/hooks/useDismiss'
import { SHELF_PATH } from '@/lib/shelfPath'

type AccountMenuProps = {
  username: string
  displayName?: string | null | undefined
  avatarUrl?: string | null | undefined
}

const MENU_LINKS = [
  { to: SHELF_PATH, label: 'My books', icon: BooksIcon, phoneOnly: true },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, phoneOnly: false },
  { to: '/help', label: 'Help', icon: HelpIcon, phoneOnly: false },
] as const

const MENU_ROW_CLASS =
  'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-normal no-underline transition-colors hover:bg-sunken'

const MENU_ICON_CLASS = 'size-[1.125rem] shrink-0'

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
        className={`flex items-center gap-1 rounded-full p-1 pr-1.5 transition-colors hover:bg-sunken ${open ? 'bg-sunken' : ''}`}
      >
        <Avatar name={name} url={avatarUrl} size="sm" />
        <ChevronDownIcon className="size-4 text-fg-3" />
      </button>

      {open ? (
        <>
          <div
            aria-hidden="true"
            data-testid="account-menu-backdrop"
            onClick={close}
            className="fixed inset-0 z-30 bg-fg/40 md:hidden"
          />
          <div className="fixed right-0 top-0 z-40 flex h-full w-72 flex-col overflow-hidden bg-raised shadow-xl md:absolute md:top-full md:z-20 md:mt-2 md:h-auto md:w-60 md:rounded-[3px] md:border md:border-rule md:shadow-card">
            <div role="menu" className="flex h-full flex-col">
              <div className="flex items-center bg-brand-soft">
                <Link
                  to="/profile"
                  onClick={close}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 no-underline hover:brightness-95"
                >
                  <Avatar name={name} url={avatarUrl} size="md" />
                  <span className="min-w-0">
                    <span className="block truncate font-title text-sm font-bold text-fg">
                      {name}
                    </span>
                    <span className="block truncate text-xs font-normal text-fg-2">
                      View your profile
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={close}
                  className="mr-3 shrink-0 p-1 text-2xl leading-none text-fg-2 hover:text-fg md:hidden"
                >
                  &times;
                </button>
              </div>
              <div className="py-1.5">
                {MENU_LINKS.map((link) => (
                  <span key={link.to} className={link.phoneOnly ? 'sm:hidden' : undefined}>
                    <MenuLink to={link.to} icon={link.icon} label={link.label} onSelect={close} />
                  </span>
                ))}
              </div>
              <div className="mt-auto border-t border-rule py-1.5 md:mt-0">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close()
                    void logout()
                  }}
                  className={`${MENU_ROW_CLASS} text-danger`}
                >
                  <LogoutIcon className={MENU_ICON_CLASS} />
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
  icon: Icon,
  label,
  onSelect,
}: {
  to: string
  icon: ComponentType<{ className?: string }>
  label: string
  onSelect: () => void
}) {
  return (
    <Link to={to} role="menuitem" onClick={onSelect} className={`${MENU_ROW_CLASS} text-fg`}>
      <Icon className={`${MENU_ICON_CLASS} text-fg-2`} />
      {label}
    </Link>
  )
}
