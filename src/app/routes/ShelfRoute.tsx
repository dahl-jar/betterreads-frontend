import { AuthenticatedPage } from '@/app/components/AuthenticatedPage'
import { ShelfList } from '@/features/shelf/components/ShelfList'

export function ShelfRoute() {
  return (
    <AuthenticatedPage>
      <h1 className="font-display text-3xl font-semibold text-ink">My books</h1>
      <div className="mt-6">
        <ShelfList />
      </div>
    </AuthenticatedPage>
  )
}
