export function bookPath(key: string): string {
  return `/books/${encodeURIComponent(key)}`
}
