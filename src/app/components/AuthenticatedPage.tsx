import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'

type PageWidth = 'medium' | 'wide'

type AuthenticatedPageProps = {
  width?: PageWidth
  children: ReactNode
}

const PAGE_WIDTHS: Record<PageWidth, string> = {
  medium: 'max-w-4xl',
  wide: 'max-w-6xl',
}

export function AuthenticatedPage({ width = 'medium', children }: AuthenticatedPageProps) {
  const { status } = useAuth()
  const pageClass = `mx-auto w-full flex-1 px-5 py-8 lg:py-12 ${PAGE_WIDTHS[width]}`

  if (status === 'loading') {
    return (
      <main className={pageClass} role="status" aria-label="Loading account" aria-busy="true">
        <Skeleton className="h-8 w-40" />
      </main>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />
  }

  return <main className={pageClass}>{children}</main>
}
