import { HttpResponse } from 'msw'

const PAGE_SIZE = 20

export function emptyPage() {
  return HttpResponse.json({ data: [], meta: { total: 0, offset: 0, limit: PAGE_SIZE } })
}
