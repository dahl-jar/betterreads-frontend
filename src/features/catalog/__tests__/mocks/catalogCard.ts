import catalogCard from './catalog-card.json'

export function makeCatalogCard(overrides: Record<string, unknown> = {}) {
  return { ...catalogCard, ...overrides }
}
