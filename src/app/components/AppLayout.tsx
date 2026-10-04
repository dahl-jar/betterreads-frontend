import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import { DraftGuardProvider, DraftNavigationGuard } from '@/components/DraftGuard'

import { Footer } from './Footer'
import { Header } from './Header'
import { RouteFallback } from './RouteFallback'

export function AppLayout() {
  return (
    <DraftGuardProvider>
      <DraftNavigationGuard />
      <div className="flex min-h-screen flex-col">
        <Header />
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
        <Footer />
      </div>
    </DraftGuardProvider>
  )
}
