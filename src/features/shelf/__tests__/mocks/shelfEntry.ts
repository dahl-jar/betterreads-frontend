import shelfEntry from './shelf-entry.json'

export function makeShelfEntry(overrides: Record<string, unknown> = {}) {
  return { ...shelfEntry, ...overrides }
}
