import { useSearchParams } from 'react-router-dom'

import { AuthenticatedPage } from '@/app/components/AuthenticatedPage'
import { rateBook } from '@/features/reviews/api/rateBook'
import { ShelfList } from '@/features/shelf/components/ShelfList'
import { parseShelfFilter, SHELF_PARAM } from '@/features/shelf/utils/shelfFilters'

export function ShelfRoute() {
  const [searchParams] = useSearchParams()
  const filter = parseShelfFilter(searchParams.get(SHELF_PARAM))

  return (
    <AuthenticatedPage width="wide">
      <ShelfList key={filter} initialFilter={filter} onRate={rateBook} />
    </AuthenticatedPage>
  )
}
