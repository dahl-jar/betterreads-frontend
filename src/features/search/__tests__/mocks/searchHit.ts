import searchHit from './search-hit.json'

export function makeSearchHit(overrides: Record<string, unknown> = {}) {
  return { ...searchHit, ...overrides }
}
