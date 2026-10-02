const SHOWN_AUTHORS = 3

export const AUTHOR_SEPARATOR = ', '
export const AUTHOR_UNKNOWN = 'Author unknown'

export function joinAuthors(authors: string[]): string {
  return authors.length > 0 ? authors.join(AUTHOR_SEPARATOR) : AUTHOR_UNKNOWN
}

export function formatAuthors(authors: string[]): string {
  const shown = joinAuthors(authors.slice(0, SHOWN_AUTHORS))
  return authors.length > SHOWN_AUTHORS ? `${shown} …` : shown
}
