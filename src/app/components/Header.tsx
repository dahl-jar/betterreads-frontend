import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { SearchForm } from '@/features/search/components/SearchForm'
import { MyBooksLink } from '@/features/shelf/components/MyBooksLink'
import { useMyShelfTotal } from '@/features/shelf/hooks/useMyShelfTotal'
import { useAuth } from '@/hooks/useAuth'
import { SHELF_PATH } from '@/lib/shelfPath'

import { SEARCH_PATH, searchPath } from '../searchPath'

import { AccountMenu } from './AccountMenu'
import { Wordmark } from './Wordmark'

const HOME_PATH = '/'

export function Header() {
  const { status, user } = useAuth()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const shelfTotal = useMyShelfTotal(status === 'authenticated')
  const query = pathname === SEARCH_PATH ? (searchParams.get('q') ?? '') : ''

  const goToSearch = (nextQuery: string) => {
    void navigate(searchPath(nextQuery))
  }

  return (
    <header className="border-b border-rule bg-ground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 px-5 sm:h-16 sm:flex-nowrap md:gap-x-8">
        <Wordmark className="flex h-14 shrink-0 items-center text-xl sm:h-auto" />

        {pathname === HOME_PATH ? null : (
          <div className="order-last min-w-0 basis-full pb-3 sm:order-none sm:flex-1 sm:basis-auto sm:pb-0 md:max-w-xl">
            <SearchForm variant="header" initialQuery={query} onSearch={goToSearch} />
          </div>
        )}

        <nav className="ml-auto flex shrink-0 items-center gap-1 text-sm font-semibold sm:gap-2">
          {status === 'authenticated' && user ? (
            <>
              <MyBooksLink count={shelfTotal} current={pathname === SHELF_PATH} />
              <AccountMenu
                username={user.username}
                displayName={user.displayName}
                avatarUrl={user.avatarUrl}
              />
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden px-3 py-2 text-fg no-underline hover:text-brand sm:block"
              >
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
