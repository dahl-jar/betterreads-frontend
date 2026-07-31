import comment from './comment.json'

export function makeComment(
  idOrOverrides: number | Record<string, unknown> = {},
  overrides: Record<string, unknown> = {},
) {
  const values =
    typeof idOrOverrides === 'number'
      ? { id: idOrOverrides, body: `Comment ${idOrOverrides}`, ...overrides }
      : idOrOverrides
  return { ...comment, ...values }
}
