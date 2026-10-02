import { seriesEntries } from '@/lib/series'

import type { BookSearchDocument } from '../api/searchBooks'

export type SearchGroup =
  | { kind: 'series'; seriesName: string; books: BookSearchDocument[] }
  | { kind: 'book'; book: BookSearchDocument }

export function groupBySeries(hits: BookSearchDocument[]): SearchGroup[] {
  const groups: SearchGroup[] = []
  const seriesByName = new Map<string, BookSearchDocument[]>()

  for (const hit of hits) {
    const entries = seriesEntries(hit)
    if (entries.length === 0) {
      groups.push({ kind: 'book', book: hit })
      continue
    }
    for (const { name } of entries) {
      const books = seriesByName.get(name)
      if (books === undefined) {
        const opened: BookSearchDocument[] = [hit]
        seriesByName.set(name, opened)
        groups.push({ kind: 'series', seriesName: name, books: opened })
      } else {
        books.push(hit)
      }
    }
  }

  for (const [name, books] of seriesByName) {
    books.sort(bySeriesPositionThenYear(name))
  }

  return groups
}

export function positionIn(hit: BookSearchDocument, seriesName: string): number | undefined {
  return seriesEntries(hit).find(({ name }) => name === seriesName)?.position
}

function bySeriesPositionThenYear(seriesName: string) {
  return (a: BookSearchDocument, b: BookSearchDocument): number => {
    const positionA = positionIn(a, seriesName)
    const positionB = positionIn(b, seriesName)
    if (positionA !== undefined && positionB !== undefined) {
      return positionA - positionB
    }
    if (positionA !== undefined) {
      return -1
    }
    if (positionB !== undefined) {
      return 1
    }
    return (a.publicationYear ?? Infinity) - (b.publicationYear ?? Infinity)
  }
}
