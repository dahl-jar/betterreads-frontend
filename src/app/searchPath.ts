export const SEARCH_PATH = '/search'

const FIRST_PAGE = 1

export function searchPath(query: string, page = FIRST_PAGE): string {
  const params = new URLSearchParams({ q: query })
  if (page > FIRST_PAGE) {
    params.set('page', String(page))
  }
  return `${SEARCH_PATH}?${params.toString()}`
}
