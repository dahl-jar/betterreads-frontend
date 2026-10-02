import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { SearchForm } from '@/features/search/components/SearchForm'
import { useAuth } from '@/hooks/useAuth'

import { SEARCH_PATH, searchPath } from '../searchPath'

import { AccountMenu } from './AccountMenu'
import { Wordmark } from './Wordmark'

const HOME_PATH = '/'

const NAV_LINK_CLASS = 'hidden text-fg no-underline hover:text-brand sm:block'

export function Header() {
  const { status, user } = useAuth()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = pathname === SEARCH_PATH ? (searchParams.get('q') ?? '') : ''

  const goToSearch = (nextQuery: string) => {
    void navigate(searchPath(nextQuery))
  }

  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 md:gap-8">
        <Wordmark className="shrink-0 text-xl" />

        {pathname === HOME_PATH ? null : (
          <SearchForm variant="header" initialQuery={query} onSearch={goToSearch} />
        )}

        <nav className="ml-auto flex shrink-0 items-center gap-4 text-sm font-semibold">
          {status === 'authenticated' && user ? (
            <>
              <Link to="/shelf" className={NAV_LINK_CLASS}>
                My books
              </Link>
              <AccountMenu
                username={user.username}
                displayName={user.displayName}
                avatarUrl={user.avatarUrl}
              />
            </>
          ) : (
            <>
              <Link to="/login" className={NAV_LINK_CLASS}>
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-accent px-4 py-2 text-on-accent no-underline hover:bg-accent-hover"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
