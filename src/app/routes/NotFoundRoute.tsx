import { useRouteError } from 'react-router-dom'

import { NotFoundPage } from '@/app/components/NotFoundPage'

type NotFoundRouteProps = {
  subject?: 'book'
}

export function NotFoundRoute({ subject }: NotFoundRouteProps) {
  const error = useRouteError()
  const kind = error ? 'error' : (subject ?? 'page')
  return <NotFoundPage kind={kind} />
}
