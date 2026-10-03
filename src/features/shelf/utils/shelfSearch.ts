import { type ShelfEntry } from '../api/shelfSchemas'

type FoldedText = {
  text: string
  starts: number[]
  ends: number[]
}

const COMBINING_MARKS = /\p{M}/gu

function foldCharacter(character: string): string {
  return character.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase()
}

function fold(text: string): string {
  return Array.from(text, foldCharacter).join('')
}

function foldText(text: string): FoldedText {
  const folded: FoldedText = { text: '', starts: [], ends: [] }
  let offset = 0
  for (const character of text) {
    const foldedCharacter = foldCharacter(character)
    folded.text += foldedCharacter
    for (let index = 0; index < foldedCharacter.length; index += 1) {
      folded.starts.push(offset)
      folded.ends.push(offset + character.length)
    }
    offset += character.length
  }
  return folded
}

function queryWords(query: string): string[] {
  return fold(query).split(/\s+/).filter(Boolean)
}

export function matchesQuery(entry: ShelfEntry, query: string): boolean {
  const searchable = fold([entry.title, ...entry.authors].join(' '))
  return queryWords(query).every((word) => searchable.includes(word))
}

function wordRanges(folded: FoldedText, word: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  let found = folded.text.indexOf(word)
  while (found !== -1) {
    ranges.push([folded.starts[found] ?? 0, folded.ends[found + word.length - 1] ?? 0])
    found = folded.text.indexOf(word, found + 1)
  }
  return ranges
}

function mergeRanges(ranges: Array<[number, number]>): Array<[number, number]> {
  const sorted = [...ranges].sort((first, second) => first[0] - second[0])
  return sorted.reduce<Array<[number, number]>>((merged, [start, end]) => {
    const last = merged.at(-1)
    if (last !== undefined && start <= last[1]) {
      return [...merged.slice(0, -1), [last[0], Math.max(last[1], end)]]
    }
    return [...merged, [start, end]]
  }, [])
}

export function matchRanges(text: string, query: string): Array<[number, number]> {
  const folded = foldText(text)
  return mergeRanges(queryWords(query).flatMap((word) => wordRanges(folded, word)))
}
