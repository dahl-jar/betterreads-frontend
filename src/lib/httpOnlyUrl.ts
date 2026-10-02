const ALLOWED_PROTOCOLS = ['http:', 'https:']

export function httpOnlyUrl(url: string): string {
  try {
    return ALLOWED_PROTOCOLS.includes(new URL(url).protocol) ? url : ''
  } catch {
    return ''
  }
}
