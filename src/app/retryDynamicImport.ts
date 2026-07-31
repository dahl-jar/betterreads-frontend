const RELOAD_GUARD_KEY = 'betterreads:chunk-reload'
const MAX_ATTEMPTS = 2

const CHUNK_ERROR_FRAGMENTS = [
  'Failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'Importing a module script failed',
] as const

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return CHUNK_ERROR_FRAGMENTS.some((fragment) => message.includes(fragment))
}

/**
 * Retries a failed route chunk once and reloads at most once when the chunk is stale.
 * Module evaluation errors propagate to the route error boundary.
 */
export async function retryDynamicImport<T extends Record<string, unknown>>(
  load: () => Promise<T>,
  reload: () => void = () => window.location.reload(),
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const module = await load()
      sessionStorage.removeItem(RELOAD_GUARD_KEY)
      return module
    } catch (error: unknown) {
      if (!isChunkLoadError(error)) {
        throw error
      }
      if (attempt === MAX_ATTEMPTS) {
        if (sessionStorage.getItem(RELOAD_GUARD_KEY) === null) {
          sessionStorage.setItem(RELOAD_GUARD_KEY, '1')
          reload()
        }
        throw error
      }
    }
  }
  throw new Error('unreachable')
}
