import { RouterProvider } from 'react-router-dom'

import { MaintenancePage } from './components/MaintenancePage'
import { RouteFallback } from './components/RouteFallback'
import { AppProvider } from './provider'
import { router } from './router'
import { useBackendAvailability } from './useBackendAvailability'

export function App() {
  const { status, retry } = useBackendAvailability()

  if (status === 'checking') {
    return <RouteFallback />
  }

  if (status === 'unavailable') {
    return <MaintenancePage onRetry={retry} />
  }

  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  )
}
