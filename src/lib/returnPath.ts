import { HOME_PATH } from './homePath'

const ACCOUNT_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]

type PageLocation = {
  pathname: string
  search: string
  hash: string
}

function recordedPath(state: unknown): string | undefined {
  if (typeof state !== 'object' || state === null || !('from' in state)) {
    return undefined
  }
  return typeof state.from === 'string' ? state.from : undefined
}

function isReturnablePath(path: string): boolean {
  const pathname = path.split(/[?#]/)[0] ?? ''
  return path.startsWith('/') && !path.startsWith('//') && !ACCOUNT_PATHS.includes(pathname)
}

export function returnPathOf(state: unknown): string {
  const path = recordedPath(state)
  return path !== undefined && isReturnablePath(path) ? path : HOME_PATH
}

export function loginState({ pathname, search, hash }: PageLocation): { from: string } {
  return { from: `${pathname}${search}${hash}` }
}

export function keptLoginState(state: unknown): { from: string } {
  return { from: returnPathOf(state) }
}
