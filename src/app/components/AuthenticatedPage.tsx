import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'

type AuthenticatedPageProps = {
  children: ReactNode
}

export function AuthenticatedPage({ children }: AuthenticatedPageProps) {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <main
        className="mx-auto w-full max-w-2xl flex-1 px-6 py-12"
        role="status"
        aria-label="Loading account"
        aria-busy="true"
      >
        <Skeleton className="h-8 w-40" />
      </main>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />
  }

  return <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">{children}</main>
}
