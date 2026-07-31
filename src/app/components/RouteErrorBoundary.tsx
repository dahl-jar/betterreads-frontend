import { Footer } from './Footer'
import { Header } from './Header'
import { NotFoundPage } from './NotFoundPage'

export function RouteErrorBoundary() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <NotFoundPage kind="error" />
      <Footer />
    </div>
  )
}
