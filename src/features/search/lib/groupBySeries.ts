import type { BookSearchDocument } from '../api/searchBooks'

export type SearchGroup =
  | { kind: 'series'; seriesName: string; books: BookSearchDocument[] }
  | { kind: 'book'; book: BookSearchDocument }

export function groupBySeries(hits: BookSearchDocument[]): SearchGroup[] {
  const groups: SearchGroup[] = []
  const seriesByName = new Map<string, BookSearchDocument[]>()

  for (const hit of hits) {
    if (hit.seriesName === undefined || hit.seriesName === null) {
      groups.push({ kind: 'book', book: hit })
      continue
    }
    const books = seriesByName.get(hit.seriesName)
    if (books === undefined) {
      const opened: BookSearchDocument[] = [hit]
      seriesByName.set(hit.seriesName, opened)
      groups.push({ kind: 'series', seriesName: hit.seriesName, books: opened })
    } else {
      books.push(hit)
    }
  }

  for (const books of seriesByName.values()) {
    books.sort(bySeriesPositionThenYear)
  }

  return groups
}

function bySeriesPositionThenYear(a: BookSearchDocument, b: BookSearchDocument): number {
  if (typeof a.seriesPosition === 'number' && typeof b.seriesPosition === 'number') {
    return a.seriesPosition - b.seriesPosition
  }
  if (typeof a.seriesPosition === 'number') {
    return -1
  }
  if (typeof b.seriesPosition === 'number') {
    return 1
  }
  return (a.publicationYear ?? Infinity) - (b.publicationYear ?? Infinity)
}
