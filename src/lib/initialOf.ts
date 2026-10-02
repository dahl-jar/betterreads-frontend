const UNKNOWN_INITIAL = '?'
const FIRST_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u

export function initialOf(text: string): string {
  const first = FIRST_LETTER_OR_DIGIT.exec(text)
  return first ? first[0].toUpperCase() : UNKNOWN_INITIAL
}
