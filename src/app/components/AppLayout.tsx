import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import { Footer } from './Footer'
import { Header } from './Header'
import { RouteFallback } from './RouteFallback'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
      <Footer />
    </div>
  )
}
