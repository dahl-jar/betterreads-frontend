import { Link } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'

import { AccountMenu } from './AccountMenu'

export function Header() {
  const { status, user } = useAuth()

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-6">
        <Link to="/" className="text-2xl tracking-tight text-ink no-underline">
          better<b className="font-extrabold">reads</b>
        </Link>

        <div className="ml-auto flex items-center gap-5 text-sm font-semibold">
          {status === 'authenticated' && user ? (
            <>
              <Link to="/shelf" className="text-ink no-underline hover:text-green">
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
              <Link to="/login" className="text-ink no-underline">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-green px-4 py-2 text-white no-underline hover:bg-green-deep"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
